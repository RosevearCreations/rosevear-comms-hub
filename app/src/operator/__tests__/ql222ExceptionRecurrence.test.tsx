// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql222OwnerDecisionAudit } from '../Ql222OwnerDecisionAudit';
import { Ql223DecisionAgingAudit } from '../Ql223DecisionAgingAudit';
import { Ql224OverdueHoldAudit } from '../Ql224OverdueHoldAudit';
import { Ql225DispositionAudit } from '../Ql225DispositionAudit';
import { Ql226RecurrenceReopenAudit } from '../Ql226RecurrenceReopenAudit';
import { Ql227DecisionEvidenceAudit } from '../Ql227DecisionEvidenceAudit';
import { Ql228HandoffContinuityAudit } from '../Ql228HandoffContinuityAudit';
import { Ql229ReassignmentAudit } from '../Ql229ReassignmentAudit';
import { Ql230ReviewerContinuityAudit } from '../Ql230ReviewerContinuityAudit';
import { Ql231DispositionOversight } from '../Ql231DispositionOversight';
import { Ql232EscalationProofAudit } from '../Ql232EscalationProofAudit';
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
import { QL223_RELEASE, QL223_CHECKS, beginQl223FollowUp, recordQl223FollowUp, advanceQl223Cycle,
  acknowledgeQl223Check, prepareQl223HoldOversight, ql223CompanyAging, ql223CompanyReceipt,
  ql223Portfolio, type Ql223Sources, type Ql223Ledger } from '../ql223DecisionAging';
import { QL224_RELEASE, QL224_CHECKS, beginQl224Replay, recordQl224Reconciliation, advanceQl224Cycle,
  acknowledgeQl224Check, prepareQl224Continuity, ql224CompanyEscalations, ql224CompanyReceipt,
  ql224Portfolio, type Ql224Sources, type Ql224Ledger } from '../ql224OverdueEscalation';
import { QL225_RELEASE, QL225_CHECKS, beginQl225Disposition, recordQl225Disposition, advanceQl225Cycle,
  acknowledgeQl225Check, prepareQl225HeldReassessment, ql225CompanyDispositions, ql225CompanyReceipt,
  ql225Portfolio, type Ql225Sources, type Ql225Ledger } from '../ql225EvidenceDisposition';
import { QL226_RELEASE, QL226_CHECKS, beginQl226Reopen, recordQl226Reopen, advanceQl226Cycle,
  acknowledgeQl226Check, prepareQl226HoldRecheck, ql226CompanyReopens, ql226CompanyReceipt,
  ql226Portfolio, type Ql226Sources, type Ql226Ledger } from '../ql226RecurrenceReopen';
import { QL227_RELEASE, QL227_CHECKS, beginQl227Audit, recordQl227Decision, advanceQl227Cycle,
  acknowledgeQl227Check, prepareQl227HeldAudit, ql227CompanyDecisions, ql227CompanyReceipt,
  ql227Portfolio, type Ql227Sources, type Ql227Ledger } from '../ql227DecisionEvidenceAudit';
import { QL228_RELEASE, QL228_CHECKS, beginQl228FollowUp, recordQl228FollowUp, advanceQl228Cycle,
  acknowledgeQl228Check, prepareQl228Continuity, ql228CompanyContinuity, ql228CompanyReceipt,
  ql228Portfolio, type Ql228Sources, type Ql228Ledger } from '../ql228HandoffContinuity';
import { QL229_RELEASE, QL229_CHECKS, beginQl229Reassessment, recordQl229Reassignment,
  advanceQl229Cycle, acknowledgeQl229Check, prepareQl229HoldReassessment,
  ql229CompanyReassignment, ql229CompanyReceipt, ql229Portfolio,
  type Ql229Sources, type Ql229Ledger } from '../ql229ReassignmentAudit';
import { QL230_RELEASE, QL230_CHECKS, beginQl230ReviewerReview, recordQl230Decision,
  advanceQl230Cycle, acknowledgeQl230Check, prepareQl230HoldAudit,
  ql230CompanyReview, ql230CompanyReceipt, ql230Portfolio,
  type Ql230Sources, type Ql230Ledger } from '../ql230ReviewerContinuity';
import { QL231_RELEASE, QL231_CHECKS, beginQl231Disposition, recordQl231Recheck,
  advanceQl231Cycle, acknowledgeQl231Check, prepareQl231Oversight,
  ql231CompanyDisposition, ql231CompanyReceipt, ql231Portfolio,
  type Ql231Sources, type Ql231Ledger } from '../ql231DispositionOversight';
import { QL232_RELEASE, QL232_CHECKS, beginQl232ProofReview, recordQl232Outcome,
  advanceQl232Cycle, acknowledgeQl232Check, prepareQl232HeldProof,
  ql232CompanyProof, ql232CompanyReceipt, ql232Portfolio,
  type Ql232Sources, type Ql232Ledger } from '../ql232EscalationProof';
import { Ql233FollowUpIntegrityAudit } from '../Ql233FollowUpIntegrityAudit';
import { QL233_RELEASE, QL233_CHECKS, beginQl233IntegrityAudit, recordQl233FollowUp,
  advanceQl233Cycle, acknowledgeQl233Check, prepareQl233HeldAudit,
  ql233CompanyIntegrity, ql233CompanyReceipt, ql233Portfolio,
  type Ql233Sources, type Ql233Ledger } from '../ql233FollowUpIntegrity';
import { Ql234SourceDriftContinuityAudit } from '../Ql234SourceDriftContinuityAudit';
import { QL234_RELEASE, QL234_CHECKS, beginQl234DriftAudit, recordQl234Drift,
  advanceQl234Cycle, acknowledgeQl234Check, prepareQl234HeldRecheck,
  ql234CompanyContinuity, ql234CompanyReceipt, ql234Portfolio,
  type Ql234Sources, type Ql234Ledger } from '../ql234SourceDriftContinuity';
import { Ql235RenewalWatchAudit } from '../Ql235RenewalWatchAudit';
import { QL235_RELEASE, QL235_CHECKS, beginQl235Renewal, recordQl235Renewal,
  advanceQl235Cycle, acknowledgeQl235Check, prepareQl235HeldAudit,
  ql235CompanyWatch, ql235CompanyReceipt, ql235Portfolio,
  type Ql235Sources, type Ql235Ledger } from '../ql235RenewalWatch';
import { Ql236ReceiptHandoffAudit } from '../Ql236ReceiptHandoffAudit';
import { QL236_RELEASE, QL236_CHECKS, beginQl236Receipt, recordQl236Receipt,
  advanceQl236Cycle, acknowledgeQl236Check, prepareQl236HeldReceipt,
  ql236CompanyReceipts, ql236CompanyReceipt, ql236Portfolio,
  type Ql236Sources, type Ql236Ledger } from '../ql236ReceiptHandoff';

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

/** Prepared synthetic QL-222 decision packets feed QL-223. No real account, SMS or approval is involved. */
function agingFixture(company: OrganizationId, recurring = false): Ql223Sources {
  const sources = fixture(company, recurring);
  let exception = beginQl222Replay(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) exception = recordQl222Decision(
    sources, exception, company, 'inbox', category,
    recurring && category === 'actual_repair' ? 'REPEATED_AFTER_REFRESH' : 'RECONFIRMED_OPEN',
    recurring && category === 'actual_repair' ? 'ESCALATE_INDEPENDENT_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Invented QL-222 ${category} source for QL-223 review`);
  for (const check of QL222_CHECKS) exception = acknowledgeQl222Check(sources, exception, company, 'inbox', check.id);
  exception = prepareQl222HoldRecheck(sources, exception, company, 'inbox');
  expect(exception[company]?.inbox?.phase).toBe('independent_hold_recheck_packet_prepared');
  return { ...sources, exception };
}

describe('QL-223 four-company owner decision aging and conditional hold oversight contract', () => {
  it('keeps four companies separated and real release entirely held in an empty preview', () => {
    const empty: Ql223Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {}, handoff: {},
      reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {}, exception: {} };
    const portfolio = ql223Portfolio(empty, {});
    expect(portfolio.companies.map((company) => company.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL223_RELEASE, eligible: 0, prepared: 0, approaching: 0,
      allReleaseHoldsPreserved: true, actualOwnerApproval: false, actualIndependentRecheck: false,
      actualClosure: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl223FollowUp(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl223HoldOversight(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current QL-222 decisions, every follow-up, risk referrals and three unverified checks', () => {
    const sources = agingFixture('devilndove', true);
    let ledger = beginQl223FollowUp(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('follow_up_aging_draft');
    expect(recordQl223FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_EXCEPTION_RECURRED', 'REFER_INDEPENDENT_DRAFT', 'short')).toBe(ledger);
    expect(recordQl223FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'UNKNOWN' as never, 'REFER_INDEPENDENT_DRAFT', 'Invented invalid evidence code')).toBe(ledger);
    ledger = recordQl223FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_EXCEPTION_RECURRED', 'CONTINUE_HOLD_DRAFT', 'Invented evidence exception needs review');
    ledger = recordQl223FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'FICTIONAL_REFRESH_NOTED', 'CONTINUE_HOLD_DRAFT', 'Fictional accessibility evidence was refreshed');
    for (const check of QL223_CHECKS) ledger = acknowledgeQl223Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql223CompanyAging(sources, ledger, 'devilndove').referralsDue).toBe(1);
    expect(prepareQl223HoldOversight(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl223FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_EXCEPTION_RECURRED', 'REFER_INDEPENDENT_DRAFT', 'Invented source referred to independent check');
    expect(ql223CompanyAging(sources, ledger, 'devilndove')).toMatchObject({
      undecided: 0, overdue: 0, referralsDue: 0, exceptionEvents: 1 });
    ledger = prepareQl223HoldOversight(sources, ledger, 'devilndove', 'inbox');
    expect(ql223CompanyAging(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl223Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl223FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'FICTIONAL_REFRESH_NOTED', 'CONTINUE_HOLD_DRAFT', 'Cannot edit a prepared packet')).toBe(ledger);
  });

  it('tracks synthetic approaching and overdue ages and counts exception events at most once per cycle', () => {
    const sources = agingFixture('yw');
    let ledger = beginQl223FollowUp(sources, {}, 'yw', 'inbox');
    ledger = recordQl223FollowUp(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'FICTIONAL_EXCEPTION_RECURRED', 'REFER_INDEPENDENT_DRAFT', 'Invented evidence recurrence in one cycle');
    ledger = recordQl223FollowUp(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'FICTIONAL_EXCEPTION_RECURRED', 'REFER_INDEPENDENT_DRAFT', 'Revised fictional evidence from same cycle');
    ledger = recordQl223FollowUp(sources, ledger, 'yw', 'inbox', 'accessibility',
      'REQUEST_PENDING_UNSENT', 'REQUEST_MORE_EVIDENCE_DRAFT', 'Invented accessibility evidence still pending');
    expect(ql223CompanyAging(sources, ledger, 'yw')).toMatchObject({ exceptionEvents: 1, pendingEvidence: 1 });
    ledger = advanceQl223Cycle(sources, ledger, 'yw', 'inbox');
    ledger = advanceQl223Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql223CompanyAging(sources, ledger, 'yw')).toMatchObject({ approaching: 2, overdue: 0 });
    ledger = advanceQl223Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql223CompanyAging(sources, ledger, 'yw')).toMatchObject({ approaching: 0, overdue: 2 });
    for (const check of QL223_CHECKS) ledger = acknowledgeQl223Check(sources, ledger, 'yw', 'inbox', check.id);
    expect(prepareQl223HoldOversight(sources, ledger, 'yw', 'inbox')).toBe(ledger);
    ledger = recordQl223FollowUp(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'FICTIONAL_EXCEPTION_RECURRED', 'REFER_INDEPENDENT_DRAFT', 'New invented cycle of evidence recurrence');
    ledger = recordQl223FollowUp(sources, ledger, 'yw', 'inbox', 'accessibility',
      'FICTIONAL_REFRESH_NOTED', 'CONTINUE_HOLD_DRAFT', 'Invented accessibility evidence refreshed');
    expect(ql223CompanyAging(sources, ledger, 'yw')).toMatchObject({ overdue: 0, exceptionEvents: 2 });
    ledger = prepareQl223HoldOversight(sources, ledger, 'yw', 'inbox');
    expect(ql223Portfolio(sources, ledger)).toMatchObject({ prepared: 1, exceptionEvents: 2, externalWrites: 0 });
  });

  it('freezes revised QL-222 sources and allows only explicit case reset without changing another company', () => {
    const a = agingFixture('rosiedazzlers');
    const b = agingFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql223Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql223Sources;
    let ledger = beginQl223FollowUp(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl223FollowUp(sources, ledger, 'icamp', 'inbox');
    const rosie = ledger.rosiedazzlers?.inbox;
    const revised: Ql223Sources = { ...sources, exception: { ...sources.exception, icamp: {
      ...sources.exception.icamp, inbox: { ...sources.exception.icamp?.inbox!, gaps: {
        ...sources.exception.icamp?.inbox?.gaps, actual_repair: {
          ...sources.exception.icamp?.inbox?.gaps.actual_repair!, note: 'Different invented QL-222 owner note' } } } } } };
    expect(ql223CompanyAging(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL222_DECISION_REVISED');
    expect(recordQl223FollowUp(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'FICTIONAL_REFRESH_NOTED', 'REFER_INDEPENDENT_DRAFT', 'Stale evidence cannot be changed')).toBe(ledger);
    ledger = beginQl223FollowUp(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(rosie);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql223CompanyAging(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql223Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql223CompanyAging(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl223FollowUp(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports status-only owner aging receipt without note content or source identity', () => {
    const sources = agingFixture('icamp');
    let ledger = beginQl223FollowUp(sources, {}, 'icamp', 'inbox');
    ledger = recordQl223FollowUp(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'FICTIONAL_REFRESH_NOTED', 'REFER_INDEPENDENT_DRAFT',
      'Sensitive fictional reviewer narrative that must not be exported');
    const receipt = ql223CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Sensitive fictional reviewer narrative');
    expect(receipt).not.toContain('simulated-followup-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-223 operator owner aging and conditional hold review interface', () => {
  it('opens new navigation, explains holds and shows a redacted empty status receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Owner decision aging & conditional holds', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql223-release="${QL223_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Owner aging help');
    expect(host.textContent).toContain('three or more');
    await click('Show local QL-223 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-223 aging and hold oversight receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql223-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('records fictional owner aging and prepares only an unverified conditional hold packet', async () => {
    const sources = agingFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql223Ledger>({});
      return <Ql223DecisionAgingAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional owner aging review');
    await select('#ql223-evidence', 'FICTIONAL_EXCEPTION_RECURRED');
    await select('#ql223-route', 'REFER_INDEPENDENT_DRAFT');
    await type('#ql223-note', 'Invented repeat evidence referred for independent check');
    await click('Record fictional evidence follow-up · UNSENT');
    await select('#ql223-gap', 'accessibility');
    await select('#ql223-evidence', 'FICTIONAL_REFRESH_NOTED');
    await select('#ql223-route', 'CONTINUE_HOLD_DRAFT');
    await type('#ql223-note', 'Invented accessibility follow-up kept held');
    await click('Record fictional evidence follow-up · UNSENT');
    for (const check of QL223_CHECKS) await click('Acknowledge conditional hold · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare follow-up & conditional hold oversight packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare follow-up & conditional hold oversight packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-223 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-223 aging and hold oversight receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented repeat evidence');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

/** QL-224 begins from a prepared fictional QL-223 decision-aging packet, never a production reviewer. */
function overdueFixture(company: OrganizationId, recurring = false): Ql224Sources {
  const sources = agingFixture(company, recurring);
  let aging = beginQl223FollowUp(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) aging = recordQl223FollowUp(
    sources, aging, company, 'inbox', category,
    recurring && category === 'actual_repair' ? 'FICTIONAL_EXCEPTION_RECURRED' : 'FICTIONAL_REFRESH_NOTED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_DRAFT' : 'CONTINUE_HOLD_DRAFT',
    `Invented QL-223 ${category} follow-up for QL-224`);
  for (const check of QL223_CHECKS) aging = acknowledgeQl223Check(sources, aging, company, 'inbox', check.id);
  aging = prepareQl223HoldOversight(sources, aging, company, 'inbox');
  expect(aging[company]?.inbox?.phase).toBe('conditional_hold_oversight_packet_prepared');
  return { ...sources, aging };
}

describe('QL-224 overdue follow-up, evidence reconciliation and independent hold contract', () => {
  it('preserves the four-company and twelve immutable QL-181 release holds in empty preview', () => {
    const empty: Ql224Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {}, handoff: {},
      reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {}, exception: {}, aging: {} };
    const portfolio = ql224Portfolio(empty, {});
    expect(portfolio.companies.map((company) => company.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL224_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentClosure: false, actualOwnerAuthorization: false,
      actualEvidenceVerified: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl224Replay(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl224Continuity(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current QL-223, reconciliation of every gap and unverified continuity checks', () => {
    const sources = overdueFixture('devilndove', true);
    let ledger = beginQl224Replay(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('overdue_escalation_replay_draft');
    expect(recordQl224Reconciliation(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'REFER_INDEPENDENT_DRAFT', 'short')).toBe(ledger);
    expect(recordQl224Reconciliation(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_INDEPENDENT_DRAFT', 'Fictional invalid evidence status')).toBe(ledger);
    ledger = recordQl224Reconciliation(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'HOLD_AND_MONITOR_DRAFT', 'Invented source mismatch still unverified');
    ledger = recordQl224Reconciliation(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'STILL_OPEN_UNVERIFIED', 'HOLD_AND_MONITOR_DRAFT', 'Fictional accessibility evidence remains held');
    for (const check of QL224_CHECKS) ledger = acknowledgeQl224Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql224CompanyEscalations(sources, ledger, 'devilndove')).toMatchObject({
      referralsDue: 1, undecided: 0, sourceConflicts: 1, conflictEvents: 1 });
    expect(prepareQl224Continuity(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl224Reconciliation(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'REFER_INDEPENDENT_DRAFT', 'Invented conflict independently referred as draft');
    ledger = prepareQl224Continuity(sources, ledger, 'devilndove', 'inbox');
    expect(ql224CompanyEscalations(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, referralsDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl224Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl224Reconciliation(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'STILL_OPEN_UNVERIFIED', 'HOLD_AND_MONITOR_DRAFT', 'Cannot edit prepared packet')).toBe(ledger);
  });

  it('requires an independent draft to refresh overdue decisions and retains historical escalation counts', () => {
    const sources = overdueFixture('yw');
    let ledger = beginQl224Replay(sources, {}, 'yw', 'inbox');
    ledger = recordQl224Reconciliation(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'STILL_OPEN_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Fictional repair gap needs recheck');
    ledger = recordQl224Reconciliation(sources, ledger, 'yw', 'inbox', 'accessibility',
      'STILL_OPEN_UNVERIFIED', 'HOLD_AND_MONITOR_DRAFT', 'Invented accessibility evidence remains open');
    for (let i = 0; i < 2; i++) ledger = advanceQl224Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql224CompanyEscalations(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl224Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql224CompanyEscalations(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl224Reconciliation(sources, ledger, 'yw', 'inbox', 'accessibility',
      'FICTIONAL_EVIDENCE_MATCHED_UNVERIFIED', 'HOLD_AND_MONITOR_DRAFT',
      'Fictional late evidence cannot skip referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl224Reconciliation(
      sources, ledger, 'yw', 'inbox', category, 'FICTIONAL_EVIDENCE_MATCHED_UNVERIFIED',
      'REFER_INDEPENDENT_DRAFT', `Fictional ${category} overdue independent referral drafted`);
    expect(ql224CompanyEscalations(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, historicalEscalations: 2, referralsDue: 0 });
    for (const check of QL224_CHECKS) ledger = acknowledgeQl224Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl224Continuity(sources, ledger, 'yw', 'inbox');
    expect(ql224Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, historicalEscalations: 2, externalWrites: 0 });
  });

  it('counts invented evidence source conflicts no more than once per gap and simulated cycle', () => {
    const sources = overdueFixture('rosiedazzlers');
    let ledger = beginQl224Replay(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl224Reconciliation(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'REFER_INDEPENDENT_DRAFT', 'Invented mismatch occurrence one');
    ledger = recordQl224Reconciliation(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'REFER_INDEPENDENT_DRAFT', 'Revised invented mismatch same cycle');
    expect(ql224CompanyEscalations(sources, ledger, 'rosiedazzlers').conflictEvents).toBe(1);
    ledger = advanceQl224Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl224Reconciliation(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'REFER_INDEPENDENT_DRAFT', 'Invented mismatch in next cycle');
    expect(ql224CompanyEscalations(sources, ledger, 'rosiedazzlers').conflictEvents).toBe(2);
    expect(ql224CompanyEscalations(sources, ledger, 'rosiedazzlers').holdAudit.conditionalRelease).toBe('BLOCKED');
  });

  it('freezes upstream QL-223 revisions, resets only the selected case and holds orphaned cases', () => {
    const a = overdueFixture('rosiedazzlers');
    const b = overdueFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql224Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql224Sources;
    let ledger = beginQl224Replay(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl224Replay(sources, ledger, 'icamp', 'inbox');
    const rosie = ledger.rosiedazzlers?.inbox;
    const revised: Ql224Sources = { ...sources, aging: { ...sources.aging, icamp: {
      ...sources.aging.icamp, inbox: { ...sources.aging.icamp?.inbox!, gaps: {
        ...sources.aging.icamp?.inbox?.gaps, actual_repair: {
          ...sources.aging.icamp?.inbox?.gaps.actual_repair!, note: 'Revised invented QL-223 source note' } } } } } };
    expect(ql224CompanyEscalations(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL223_FOLLOW_UP_REVISED');
    expect(recordQl224Reconciliation(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'STILL_OPEN_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Stale fictional source')).toBe(ledger);
    ledger = beginQl224Replay(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(rosie);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql224CompanyEscalations(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql224Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql224CompanyEscalations(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl224Replay(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('produces a PII-minimized fixed status receipt without source fingerprints or private notes', () => {
    const sources = overdueFixture('icamp');
    let ledger = beginQl224Replay(sources, {}, 'icamp', 'inbox');
    ledger = recordQl224Reconciliation(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'FICTIONAL_SOURCE_CONFLICT', 'REFER_INDEPENDENT_DRAFT',
      'Secret invented independent reviewer narrative must never be exported');
    const receipt = ql224CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret invented independent reviewer narrative');
    expect(receipt).not.toContain('invented-overdue-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-224 four-company overdue escalation and hold continuity interface', () => {
  it('opens new navigation with hold warnings, help, source link and redacted empty receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Overdue escalation & hold continuity', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql224-release="${QL224_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Overdue escalation help');
    expect(host.textContent).toContain('remains counted after refresh');
    await click('Show local QL-224 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-224 overdue escalation receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql224-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares only a synthetic unverified independent hold packet after risk routing and checks', async () => {
    const sources = overdueFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql224Ledger>({});
      return <Ql224OverdueHoldAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional overdue escalation replay');
    await select('#ql224-evidence', 'FICTIONAL_SOURCE_CONFLICT');
    await select('#ql224-route', 'REFER_INDEPENDENT_DRAFT');
    await type('#ql224-note', 'Invented evidence conflict requires unsent independent referral');
    await click('Record fictional escalation & evidence reconciliation · UNSENT');
    await select('#ql224-gap', 'accessibility');
    await select('#ql224-evidence', 'STILL_OPEN_UNVERIFIED');
    await select('#ql224-route', 'HOLD_AND_MONITOR_DRAFT');
    await type('#ql224-note', 'Fictional accessibility evidence is still unverified');
    await click('Record fictional escalation & evidence reconciliation · UNSENT');
    for (const check of QL224_CHECKS) await click('Acknowledge independent hold · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare overdue escalation & hold continuity packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare overdue escalation & hold continuity packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-224 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-224 overdue escalation receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented evidence conflict');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function dispositionFixture(company: OrganizationId, recurring = false): Ql225Sources {
  const sources = overdueFixture(company, recurring);
  let overdue = beginQl224Replay(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) overdue = recordQl224Reconciliation(
    sources, overdue, company, 'inbox', category,
    category === 'actual_repair' ? 'FICTIONAL_SOURCE_CONFLICT' : 'STILL_OPEN_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_DRAFT' : 'HOLD_AND_MONITOR_DRAFT',
    `Fictional QL-224 ${category} source outcome remains unverified`);
  for (const check of QL224_CHECKS) overdue = acknowledgeQl224Check(sources, overdue, company, 'inbox', check.id);
  overdue = prepareQl224Continuity(sources, overdue, company, 'inbox');
  expect(overdue[company]?.inbox?.phase).toBe('independent_hold_continuity_packet_prepared');
  return { ...sources, overdue };
}

describe('QL-225 fictional independent evidence disposition and held-release reassessment contract', () => {
  it('starts only from QL-224 current prepared sources across four separated companies and keeps twelve actual holds', () => {
    const empty: Ql225Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {} };
    const portfolio = ql225Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL225_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentDisposition: false,
      actualEvidenceVerified: false, actualOwnerAuthorization: false, livePilotReady: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl225Disposition(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl225HeldReassessment(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires all fictional evidence dispositions, independently routed high-risk outcomes and unverified checks', () => {
    const sources = dispositionFixture('devilndove', true);
    let ledger = beginQl225Disposition(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('escalation_outcome_disposition_draft');
    expect(recordQl225Disposition(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'short')).toBe(ledger);
    expect(recordQl225Disposition(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_INDEPENDENT_DRAFT', 'Invented unsupported status')).toBe(ledger);
    ledger = recordQl225Disposition(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'CONTINUE_HELD_MONITOR_DRAFT', 'Fictional discrepancy still pending independent decision');
    ledger = recordQl225Disposition(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'EVIDENCE_PENDING_UNVERIFIED', 'CONTINUE_HELD_MONITOR_DRAFT', 'Fictional accessibility evidence still pending');
    for (const check of QL225_CHECKS) ledger = acknowledgeQl225Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql225CompanyDispositions(sources, ledger, 'devilndove')).toMatchObject({
      undecided: 0, discrepancies: 1, discrepancyEvents: 1, referralsDue: 1 });
    expect(prepareQl225HeldReassessment(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl225Disposition(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Independent discrepancy route is an unsent fictional draft');
    ledger = prepareQl225HeldReassessment(sources, ledger, 'devilndove', 'inbox');
    expect(ql225CompanyDispositions(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, referralsDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl225Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl225Disposition(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'EVIDENCE_PENDING_UNVERIFIED', 'REQUEST_EVIDENCE_DRAFT', 'Cannot change prepared local packet')).toBe(ledger);
  });

  it('flags due-soon and overdue outcomes, requires independent late referral, and preserves history after refresh', () => {
    const sources = dispositionFixture('yw');
    let ledger = beginQl225Disposition(sources, {}, 'yw', 'inbox');
    ledger = recordQl225Disposition(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'EVIDENCE_PENDING_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Fictional repair evidence needs review');
    ledger = recordQl225Disposition(sources, ledger, 'yw', 'inbox', 'accessibility',
      'EVIDENCE_PENDING_UNVERIFIED', 'REQUEST_EVIDENCE_DRAFT', 'Invented accessibility follow-up is held');
    for (let i = 0; i < 2; i++) ledger = advanceQl225Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql225CompanyDispositions(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl225Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql225CompanyDispositions(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl225Disposition(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_REVIEW_NOTED_UNVERIFIED', 'REQUEST_EVIDENCE_DRAFT',
      'Late fictional review cannot bypass independent referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl225Disposition(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_REVIEW_NOTED_UNVERIFIED',
      'REFER_INDEPENDENT_DRAFT', `Fictional ${category} overdue independent referral`);
    expect(ql225CompanyDispositions(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueEpisodes: 2, referralsDue: 0 });
    for (const check of QL225_CHECKS) ledger = acknowledgeQl225Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl225HeldReassessment(sources, ledger, 'yw', 'inbox');
    expect(ql225Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueEpisodes: 2, actualIndependentDisposition: false, externalWrites: 0 });
  });

  it('deduplicates invented discrepancy events per gap and simulated cycle', () => {
    const sources = dispositionFixture('rosiedazzlers');
    let ledger = beginQl225Disposition(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl225Disposition(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Fictional discrepancy initial event');
    ledger = recordQl225Disposition(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Reworded invented discrepancy in same cycle');
    expect(ql225CompanyDispositions(sources, ledger, 'rosiedazzlers').discrepancyEvents).toBe(1);
    ledger = advanceQl225Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl225Disposition(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Fictional discrepancy new cycle');
    expect(ql225CompanyDispositions(sources, ledger, 'rosiedazzlers').discrepancyEvents).toBe(2);
  });

  it('freezes QL-224 revisions, resets only one case, and never closes orphaned upstream gaps', () => {
    const a = dispositionFixture('rosiedazzlers');
    const b = dispositionFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql225Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql225Sources;
    let ledger = beginQl225Disposition(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl225Disposition(sources, ledger, 'icamp', 'inbox');
    const otherCompany = ledger.rosiedazzlers?.inbox;
    const revised: Ql225Sources = { ...sources, overdue: { ...sources.overdue, icamp: {
      ...sources.overdue.icamp, inbox: { ...sources.overdue.icamp?.inbox!, gaps: {
        ...sources.overdue.icamp?.inbox?.gaps, actual_repair: {
          ...sources.overdue.icamp?.inbox?.gaps.actual_repair!, note: 'Revised invented QL-224 evidence review note' } } } } } };
    expect(ql225CompanyDispositions(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL224_OUTCOME_REVISED');
    expect(recordQl225Disposition(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'EVIDENCE_PENDING_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Cannot act on stale fictional evidence')).toBe(ledger);
    ledger = beginQl225Disposition(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(otherCompany);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql225CompanyDispositions(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql225Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql225CompanyDispositions(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl225Disposition(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports coded status only, never private notes, reviewer identity or source tokens', () => {
    const sources = dispositionFixture('icamp');
    let ledger = beginQl225Disposition(sources, {}, 'icamp', 'inbox');
    ledger = recordQl225Disposition(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_DISCREPANCY_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT',
      'Secret imaginary reviewer narrative must never appear in export');
    const receipt = ql225CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret imaginary reviewer narrative');
    expect(receipt).not.toContain('fictional-disposition-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-225 four-company escalation outcome and evidence disposition interface', () => {
  it('opens the held release workspace, exposes help, organization switching and a redacted receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Evidence disposition & held-release reassessment', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql225-release="${QL225_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Evidence disposition help');
    expect(host.textContent).toContain('A changed source freezes the case');
    await click('Show local QL-225 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-225 evidence disposition receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql225-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares a locally held fictional packet only after risk referral and all checks', async () => {
    const sources = dispositionFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql225Ledger>({});
      return <Ql225DispositionAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional independent evidence disposition');
    await select('#ql225-disposition', 'SIMULATED_DISCREPANCY_UNVERIFIED');
    await select('#ql225-follow-up', 'REFER_INDEPENDENT_DRAFT');
    await type('#ql225-note', 'Invented independent source discrepancy remains unverified');
    await click('Record fictional evidence disposition · UNSENT');
    await select('#ql225-gap', 'accessibility');
    await select('#ql225-disposition', 'EVIDENCE_PENDING_UNVERIFIED');
    await select('#ql225-follow-up', 'CONTINUE_HELD_MONITOR_DRAFT');
    await type('#ql225-note', 'Fictional accessibility evidence pending independent review');
    await click('Record fictional evidence disposition · UNSENT');
    for (const check of QL225_CHECKS) await click('Acknowledge held reassessment · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare independent evidence & held-release reassessment packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare independent evidence & held-release reassessment packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-225 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-225 evidence disposition receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented independent source discrepancy');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function reopenFixture(company: OrganizationId, recurring = false): Ql226Sources {
  const sources = dispositionFixture(company, recurring);
  let disposition = beginQl225Disposition(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) disposition = recordQl225Disposition(
    sources, disposition, company, 'inbox', category,
    category === 'actual_repair' ? 'SIMULATED_DISCREPANCY_UNVERIFIED' : 'EVIDENCE_PENDING_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_DRAFT' : 'CONTINUE_HELD_MONITOR_DRAFT',
    `Invented QL-225 ${category} outcome remains unverified`);
  for (const check of QL225_CHECKS) disposition = acknowledgeQl225Check(sources, disposition, company, 'inbox', check.id);
  disposition = prepareQl225HeldReassessment(sources, disposition, company, 'inbox');
  expect(disposition[company]?.inbox?.phase).toBe('held_release_reassessment_packet_prepared');
  return { ...sources, disposition };
}

describe('QL-226 fictional independent disposition recurrence, owner reopening and conditional holds', () => {
  it('keeps four company boundaries and twelve actual held prerequisites without live operations', () => {
    const empty: Ql226Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {} };
    const portfolio = ql226Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL226_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentRecheck: false, actualEvidenceVerified: false,
      actualOwnerAuthorization: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl226Reopen(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl226HoldRecheck(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current prepared QL-225, all gap outcomes, risk referrals and three unverified checks', () => {
    const sources = reopenFixture('devilndove', true);
    let ledger = beginQl226Reopen(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('independent_recurrence_reopen_draft');
    expect(recordQl226Reopen(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'short')).toBe(ledger);
    expect(recordQl226Reopen(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_INDEPENDENT_DRAFT', 'Invented invalid outcome')).toBe(ledger);
    ledger = recordQl226Reopen(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT', 'Fictional repeat exception needs independent follow-up');
    ledger = recordQl226Reopen(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'MONITOR_OPEN_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT', 'Invented accessibility issue still held');
    for (const check of QL226_CHECKS) ledger = acknowledgeQl226Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql226CompanyReopens(sources, ledger, 'devilndove')).toMatchObject({
      reopened: 1, reopenEvents: 1, undecided: 0, referralsDue: 1 });
    expect(prepareQl226HoldRecheck(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl226Reopen(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Fictional independent referral unsent');
    ledger = prepareQl226HoldRecheck(sources, ledger, 'devilndove', 'inbox');
    expect(ql226CompanyReopens(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, referralsDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl226Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl226Reopen(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'MONITOR_OPEN_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT', 'Cannot edit prepared packet')).toBe(ledger);
  });

  it('ages owner follow-ups, requires late independent recheck, and retains historical overdue episodes', () => {
    const sources = reopenFixture('yw');
    let ledger = beginQl226Reopen(sources, {}, 'yw', 'inbox');
    ledger = recordQl226Reopen(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Invented repair exception reopened');
    ledger = recordQl226Reopen(sources, ledger, 'yw', 'inbox', 'accessibility',
      'MONITOR_OPEN_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT', 'Fictional accessibility owner monitoring');
    for (let i = 0; i < 2; i++) ledger = advanceQl226Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql226CompanyReopens(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl226Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql226CompanyReopens(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl226Reopen(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_RECHECK_RECORDED_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT',
      'Cannot refresh invented overdue without independent referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl226Reopen(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_RECHECK_RECORDED_UNVERIFIED',
      'REFER_INDEPENDENT_DRAFT', `Invented ${category} late referral still unsent`);
    expect(ql226CompanyReopens(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueFollowUps: 2, reopenEvents: 1, referralsDue: 0 });
    for (const check of QL226_CHECKS) ledger = acknowledgeQl226Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl226HoldRecheck(sources, ledger, 'yw', 'inbox');
    expect(ql226Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueFollowUps: 2, reopenEvents: 1, actualIndependentRecheck: false, externalWrites: 0 });
  });

  it('counts fictional reopening only once per gap per simulated cycle', () => {
    const sources = reopenFixture('rosiedazzlers');
    let ledger = beginQl226Reopen(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl226Reopen(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Fictional reopened evidence first event');
    ledger = recordQl226Reopen(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Revised reopened note same cycle');
    expect(ql226CompanyReopens(sources, ledger, 'rosiedazzlers').reopenEvents).toBe(1);
    ledger = advanceQl226Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl226Reopen(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT', 'Invented new cycle of reopen');
    expect(ql226CompanyReopens(sources, ledger, 'rosiedazzlers').reopenEvents).toBe(2);
  });

  it('freezes upstream evidence changes, resets only the selected case and leaves orphaned cases held', () => {
    const a = reopenFixture('rosiedazzlers');
    const b = reopenFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql226Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql226Sources;
    let ledger = beginQl226Reopen(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl226Reopen(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql226Sources = { ...sources, disposition: { ...sources.disposition, icamp: {
      ...sources.disposition.icamp, inbox: { ...sources.disposition.icamp?.inbox!, gaps: {
        ...sources.disposition.icamp?.inbox?.gaps, actual_repair: {
          ...sources.disposition.icamp?.inbox?.gaps.actual_repair!, note: 'Revised invented QL-225 independent evidence disposition' } } } } } };
    expect(ql226CompanyReopens(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL225_DISPOSITION_REVISED');
    expect(recordQl226Reopen(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'MONITOR_OPEN_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT', 'Cannot alter a stale source')).toBe(ledger);
    ledger = beginQl226Reopen(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql226CompanyReopens(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql226Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql226CompanyReopens(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl226Reopen(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports coded recurrence counts without private notes, reviewer identities or revision tokens', () => {
    const sources = reopenFixture('icamp');
    let ledger = beginQl226Reopen(sources, {}, 'icamp', 'inbox');
    ledger = recordQl226Reopen(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'REOPENED_EXCEPTION_UNVERIFIED', 'REFER_INDEPENDENT_DRAFT',
      'Secret fictitious independent reviewer remarks never belong in export');
    const receipt = ql226CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret fictitious independent reviewer remarks');
    expect(receipt).not.toContain('invented-reopen-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-226 operator independent recurrence and owner reopening interface', () => {
  it('opens the new four-company navigation, help, held prerequisites and redacted receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Independent recurrence & owner reopen', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql226-release="${QL226_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Recurrence & reopen help');
    expect(host.textContent).toContain('confirmed case-only reset');
    await click('Show local QL-226 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-226 recurrence reopen receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql226-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares a held local packet only after gap outcomes, independent referral and unverified checks', async () => {
    const sources = reopenFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql226Ledger>({});
      return <Ql226RecurrenceReopenAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional recurrence & reopen review');
    await select('#ql226-outcome', 'REOPENED_EXCEPTION_UNVERIFIED');
    await select('#ql226-route', 'REFER_INDEPENDENT_DRAFT');
    await type('#ql226-note', 'Invented repeated independent evidence exception remains held');
    await click('Record fictional recurrence & owner reopen · UNSENT');
    await select('#ql226-gap', 'accessibility');
    await select('#ql226-outcome', 'MONITOR_OPEN_UNVERIFIED');
    await select('#ql226-route', 'MAINTAIN_HOLD_DRAFT');
    await type('#ql226-note', 'Fictional accessibility evidence remains unverified');
    await click('Record fictional recurrence & owner reopen · UNSENT');
    for (const check of QL226_CHECKS) await click('Acknowledge conditional hold · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare reopened evidence & conditional hold recheck packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare reopened evidence & conditional hold recheck packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-226 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-226 recurrence reopen receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented repeated independent evidence exception');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function evidenceAuditFixture(company: OrganizationId, recurring = false): Ql227Sources {
  const sources = reopenFixture(company, recurring);
  let reopenReview = beginQl226Reopen(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reopenReview = recordQl226Reopen(
    sources, reopenReview, company, 'inbox', category,
    category === 'actual_repair' ? 'REOPENED_EXCEPTION_UNVERIFIED' : 'MONITOR_OPEN_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Invented QL-226 ${category} reopened outcome still needs actual evidence`);
  for (const check of QL226_CHECKS) reopenReview = acknowledgeQl226Check(sources, reopenReview, company, 'inbox', check.id);
  reopenReview = prepareQl226HoldRecheck(sources, reopenReview, company, 'inbox');
  expect(reopenReview[company]?.inbox?.phase).toBe('conditional_release_hold_recheck_packet_prepared');
  return { ...sources, reopenReview };
}

describe('QL-227 four-company reopened owner decision aging and independent evidence contract', () => {
  it('holds all twelve actual QL-181 prerequisites and never treats a fictional receipt as real evidence', () => {
    const empty: Ql227Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {} };
    const portfolio = ql227Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL227_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualEvidenceVerified: false,
      actualIndependentReview: false, actualOwnerAuthorization: false, livePilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl227Audit(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl227HeldAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('gates local preparation on current QL-226, gap reconciliation, independent referrals and unverified checks', () => {
    const sources = evidenceAuditFixture('devilndove', true);
    let ledger = beginQl227Audit(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('reopened_owner_decision_evidence_reconciliation_draft');
    expect(recordQl227Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'short')).toBe(ledger);
    expect(recordQl227Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Invented invalid status')).toBe(ledger);
    ledger = recordQl227Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'CONTINUE_HELD_FOLLOW_UP_DRAFT', 'Fictional reopened evidence still unverified');
    ledger = recordQl227Decision(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'EVIDENCE_STILL_OPEN_UNVERIFIED', 'CONTINUE_HELD_FOLLOW_UP_DRAFT', 'Invented accessibility still on hold');
    for (const check of QL227_CHECKS) ledger = acknowledgeQl227Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql227CompanyDecisions(sources, ledger, 'devilndove')).toMatchObject({
      undecided: 0, conflicts: 1, conflictEvents: 1, referralsDue: 1 });
    expect(prepareQl227HeldAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl227Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Fictional independent referral unsent');
    ledger = prepareQl227HeldAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql227CompanyDecisions(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, referralsDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl227Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl227Decision(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_MATCH_UNVERIFIED', 'CONTINUE_HELD_FOLLOW_UP_DRAFT', 'Prepared packet is locked')).toBe(ledger);
  });

  it('ages owner decisions, requires an independent late referral, and retains historical overdue counts', () => {
    const sources = evidenceAuditFixture('yw');
    let ledger = beginQl227Audit(sources, {}, 'yw', 'inbox');
    ledger = recordQl227Decision(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'EVIDENCE_STILL_OPEN_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Fictional repair evidence held for recheck');
    ledger = recordQl227Decision(sources, ledger, 'yw', 'inbox', 'accessibility',
      'EVIDENCE_STILL_OPEN_UNVERIFIED', 'CONTINUE_HELD_FOLLOW_UP_DRAFT', 'Invented accessibility evidence unverified');
    for (let i = 0; i < 2; i++) ledger = advanceQl227Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql227CompanyDecisions(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl227Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql227CompanyDecisions(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl227Decision(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_MATCH_UNVERIFIED', 'CONTINUE_HELD_FOLLOW_UP_DRAFT',
      'Late invented evidence cannot bypass an independent referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl227Decision(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_MATCH_UNVERIFIED',
      'REFER_INDEPENDENT_RECHECK_DRAFT', `Invented ${category} independent late recheck unsent`);
    expect(ql227CompanyDecisions(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueDecisions: 2, referralsDue: 0 });
    for (const check of QL227_CHECKS) ledger = acknowledgeQl227Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl227HeldAudit(sources, ledger, 'yw', 'inbox');
    expect(ql227Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueDecisions: 2, actualIndependentReview: false, externalWrites: 0 });
  });

  it('counts invented evidence source conflicts at most once per gap per synthetic cycle', () => {
    const sources = evidenceAuditFixture('rosiedazzlers');
    let ledger = beginQl227Audit(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl227Decision(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Invented source mismatch first event');
    ledger = recordQl227Decision(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Reworded invented source conflict same cycle');
    expect(ql227CompanyDecisions(sources, ledger, 'rosiedazzlers').conflictEvents).toBe(1);
    ledger = advanceQl227Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl227Decision(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Invented source conflict next cycle');
    expect(ql227CompanyDecisions(sources, ledger, 'rosiedazzlers').conflictEvents).toBe(2);
  });

  it('freezes QL-226 source revisions, resets one case only and keeps orphaned sources held', () => {
    const a = evidenceAuditFixture('rosiedazzlers');
    const b = evidenceAuditFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql227Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql227Sources;
    let ledger = beginQl227Audit(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl227Audit(sources, ledger, 'icamp', 'inbox');
    const otherCompany = ledger.rosiedazzlers?.inbox;
    const revised: Ql227Sources = { ...sources, reopenReview: { ...sources.reopenReview, icamp: {
      ...sources.reopenReview.icamp, inbox: { ...sources.reopenReview.icamp?.inbox!, gaps: {
        ...sources.reopenReview.icamp?.inbox?.gaps, actual_repair: {
          ...sources.reopenReview.icamp?.inbox?.gaps.actual_repair!, note: 'Revised invented QL-226 owner follow-up evidence' } } } } } };
    expect(ql227CompanyDecisions(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL226_REOPEN_OUTCOME_REVISED');
    expect(recordQl227Decision(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'EVIDENCE_STILL_OPEN_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Cannot act on stale source')).toBe(ledger);
    ledger = beginQl227Audit(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(otherCompany);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql227CompanyDecisions(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql227Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql227CompanyDecisions(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl227Audit(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports only PII-minimized status without notes, reviewers or source revision fingerprints', () => {
    const sources = evidenceAuditFixture('icamp');
    let ledger = beginQl227Audit(sources, {}, 'icamp', 'inbox');
    ledger = recordQl227Decision(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT',
      'Secret fictional independent reviewer details must not be exported');
    const receipt = ql227CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret fictional independent reviewer details');
    expect(receipt).not.toContain('synthetic-reconciliation-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-227 operator owner decision aging and independent evidence UI', () => {
  it('shows held release, help, source navigation and redacted receipt across companies', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Owner aging & independent evidence audit', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql227-release="${QL227_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Owner decision aging help');
    expect(host.textContent).toContain('explicit case-only reset');
    await click('Show local QL-227 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-227 independent evidence receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql227-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares only a source-current fictional packet after both evidence decisions and held audit checks', async () => {
    const sources = evidenceAuditFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql227Ledger>({});
      return <Ql227DecisionEvidenceAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional owner decision & evidence audit');
    await select('#ql227-evidence', 'SIMULATED_CONFLICT_UNVERIFIED');
    await select('#ql227-decision', 'REFER_INDEPENDENT_RECHECK_DRAFT');
    await type('#ql227-note', 'Invented reopened source conflict requires independent review');
    await click('Record fictional owner decision & evidence reconciliation · UNSENT');
    await select('#ql227-gap', 'accessibility');
    await select('#ql227-evidence', 'EVIDENCE_STILL_OPEN_UNVERIFIED');
    await select('#ql227-decision', 'CONTINUE_HELD_FOLLOW_UP_DRAFT');
    await type('#ql227-note', 'Fictional accessibility evidence remains pending');
    await click('Record fictional owner decision & evidence reconciliation · UNSENT');
    for (const check of QL227_CHECKS) await click('Acknowledge held-release audit · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare owner evidence reconciliation & held-release audit packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare owner evidence reconciliation & held-release audit packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-227 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-227 independent evidence receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented reopened source conflict');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function handoffContinuityFixture(company: OrganizationId, recurring = false): Ql228Sources {
  const sources = evidenceAuditFixture(company, recurring);
  let evidenceAudit = beginQl227Audit(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) evidenceAudit = recordQl227Decision(
    sources, evidenceAudit, company, 'inbox', category,
    category === 'actual_repair' ? 'SIMULATED_CONFLICT_UNVERIFIED' : 'EVIDENCE_STILL_OPEN_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_RECHECK_DRAFT' : 'CONTINUE_HELD_FOLLOW_UP_DRAFT',
    `Fictional QL-227 ${category} follow-up remains unverified`);
  for (const check of QL227_CHECKS) evidenceAudit = acknowledgeQl227Check(sources, evidenceAudit, company, 'inbox', check.id);
  evidenceAudit = prepareQl227HeldAudit(sources, evidenceAudit, company, 'inbox');
  expect(evidenceAudit[company]?.inbox?.phase).toBe('held_release_follow_up_audit_packet_prepared');
  return { ...sources, evidenceAudit };
}

describe('QL-228 four-company evidence exception recurrence and independent handoff contract', () => {
  it('keeps all twelve actual holds and prevents a fictional handoff from authorizing live communications', () => {
    const empty: Ql228Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {} };
    const portfolio = ql228Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((organization) => organization.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL228_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentHandoff: false,
      actualEvidenceVerified: false, actualOwnerAuthorization: false, livePilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl228FollowUp(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl228Continuity(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current QL-227, all gap decisions, independent reassignment and unverified review checks', () => {
    const sources = handoffContinuityFixture('devilndove', true);
    let ledger = beginQl228FollowUp(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('independent_handoff_recurrence_follow_up_draft');
    expect(recordQl228FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'short')).toBe(ledger);
    expect(recordQl228FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'Invented invalid evidence')).toBe(ledger);
    ledger = recordQl228FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'MAINTAIN_HELD_HANDOFF_DRAFT', 'Invented repeated independent evidence exception');
    ledger = recordQl228FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED', 'MAINTAIN_HELD_HANDOFF_DRAFT', 'Fictional accessibility handoff still pending');
    for (const check of QL228_CHECKS) ledger = acknowledgeQl228Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql228CompanyContinuity(sources, ledger, 'devilndove')).toMatchObject({
      unreviewed: 0, recurring: 1, recurrenceEvents: 1, handoffsDue: 1 });
    expect(prepareQl228Continuity(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl228FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'Invented independent reassignment draft remains unsent');
    ledger = prepareQl228Continuity(sources, ledger, 'devilndove', 'inbox');
    expect(ql228CompanyContinuity(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, handoffsDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl228Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl228FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_MATCH_UNVERIFIED', 'MAINTAIN_HELD_HANDOFF_DRAFT', 'Prepared local packet is locked')).toBe(ledger);
  });

  it('retains overdue independent handoff history and requires reassignment after the deadline', () => {
    const sources = handoffContinuityFixture('yw');
    let ledger = beginQl228FollowUp(sources, {}, 'yw', 'inbox');
    ledger = recordQl228FollowUp(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'Fictional repair handoff held for reassignment');
    ledger = recordQl228FollowUp(sources, ledger, 'yw', 'inbox', 'accessibility',
      'EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED', 'MAINTAIN_HELD_HANDOFF_DRAFT', 'Invented accessibility follow-up pending');
    for (let i = 0; i < 2; i++) ledger = advanceQl228Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql228CompanyContinuity(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl228Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql228CompanyContinuity(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl228FollowUp(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_MATCH_UNVERIFIED', 'MAINTAIN_HELD_HANDOFF_DRAFT', 'Late evidence cannot bypass independent follow-up')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl228FollowUp(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_MATCH_UNVERIFIED',
      'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', `Fictional ${category} overdue handoff reallocated`);
    expect(ql228CompanyContinuity(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueHandoffs: 2, handoffsDue: 0 });
    for (const check of QL228_CHECKS) ledger = acknowledgeQl228Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl228Continuity(sources, ledger, 'yw', 'inbox');
    expect(ql228Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueHandoffs: 2, actualIndependentHandoff: false, externalWrites: 0 });
  });

  it('counts synthetic recurring exceptions only once per category per cycle', () => {
    const sources = handoffContinuityFixture('rosiedazzlers');
    let ledger = beginQl228FollowUp(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl228FollowUp(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'First invented recurrence');
    ledger = recordQl228FollowUp(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'Reworded same-cycle recurrence');
    expect(ql228CompanyContinuity(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(1);
    ledger = advanceQl228Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl228FollowUp(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'New invented recurrence cycle');
    expect(ql228CompanyContinuity(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(2);
  });

  it('freezes revised QL-227 source, supports case-only reset and leaves orphaned evidence held', () => {
    const a = handoffContinuityFixture('rosiedazzlers');
    const b = handoffContinuityFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql228Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql228Sources;
    let ledger = beginQl228FollowUp(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl228FollowUp(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql228Sources = { ...sources, evidenceAudit: { ...sources.evidenceAudit, icamp: {
      ...sources.evidenceAudit.icamp, inbox: { ...sources.evidenceAudit.icamp?.inbox!, gaps: {
        ...sources.evidenceAudit.icamp?.inbox?.gaps, actual_repair: {
          ...sources.evidenceAudit.icamp?.inbox?.gaps.actual_repair!, note: 'Changed fictional QL-227 source owner decision note' } } } } } };
    expect(ql228CompanyContinuity(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL227_EVIDENCE_DECISION_REVISED');
    expect(recordQl228FollowUp(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT', 'Cannot alter stale evidence')).toBe(ledger);
    ledger = beginQl228FollowUp(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql228CompanyContinuity(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql228Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql228CompanyContinuity(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl228FollowUp(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports a privacy-minimized held audit without notes, fingerprints or reviewer identity', () => {
    const sources = handoffContinuityFixture('icamp');
    let ledger = beginQl228FollowUp(sources, {}, 'icamp', 'inbox');
    ledger = recordQl228FollowUp(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT',
      'Secret fictional reviewer handoff notes should never appear in exported data');
    const receipt = ql228CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret fictional reviewer handoff notes');
    expect(receipt).not.toContain('fictional-handoff-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-228 operator evidence exception and independent handoff interface', () => {
  it('shows the new navigation, four-company hold matrix, help, source and redacted receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Evidence recurrence & handoff continuity', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql228-release="${QL228_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Exception & handoff help');
    expect(host.textContent).toContain('confirmed reset');
    await click('Show local QL-228 continuity receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-228 held handoff receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql228-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares a fictional held handoff only with complete source-linked decisions and checks', async () => {
    const sources = handoffContinuityFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql228Ledger>({});
      return <Ql228HandoffContinuityAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional evidence exception & handoff follow-up');
    await select('#ql228-exception', 'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED');
    await select('#ql228-handoff', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT');
    await type('#ql228-note', 'Fictional repaired evidence repeated and needs independent handoff');
    await click('Record fictional recurrence & independent handoff · UNSENT');
    await select('#ql228-gap', 'accessibility');
    await select('#ql228-exception', 'EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED');
    await select('#ql228-handoff', 'MAINTAIN_HELD_HANDOFF_DRAFT');
    await type('#ql228-note', 'Invented accessibility handoff remains unverified');
    await click('Record fictional recurrence & independent handoff · UNSENT');
    for (const check of QL228_CHECKS) await click('Acknowledge continuity check · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare independent handoff & hold continuity packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare independent handoff & hold continuity packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-228 continuity receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-228 held handoff receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Fictional repaired evidence repeated');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function reassignmentFixture(company: OrganizationId, recurring = false): Ql229Sources {
  const sources = handoffContinuityFixture(company, recurring);
  let handoffContinuity = beginQl228FollowUp(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) handoffContinuity = recordQl228FollowUp(
    sources, handoffContinuity, company, 'inbox', category,
    category === 'actual_repair' ? 'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED' : 'EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED',
    category === 'actual_repair' ? 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT' : 'MAINTAIN_HELD_HANDOFF_DRAFT',
    `Invented QL-228 ${category} independent handoff remains unverified`);
  for (const check of QL228_CHECKS) handoffContinuity = acknowledgeQl228Check(sources, handoffContinuity,
    company, 'inbox', check.id);
  handoffContinuity = prepareQl228Continuity(sources, handoffContinuity, company, 'inbox');
  expect(handoffContinuity[company]?.inbox?.phase).toBe('conditional_hold_continuity_packet_prepared');
  return { ...sources, handoffContinuity };
}

describe('QL-229 four-company independent handoff aging and reassignment reconciliation contract', () => {
  it('preserves all twelve real holds, company boundaries and zero external communications', () => {
    const empty: Ql229Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {}, handoffContinuity: {} };
    const portfolio = ql229Portfolio(empty, {});
    expect(portfolio.companies.map((company) => company.company)).toEqual(operatorOrganizations.map((organization) => organization.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL229_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReassignment: false,
      actualEvidenceVerified: false, actualOwnerAuthorization: false,
      livePilotReady: false, providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl229Reassessment(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl229HoldReassessment(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires prepared current QL-228, reassignment outcomes, independent referrals and all checks', () => {
    const sources = reassignmentFixture('devilndove', true);
    let ledger = beginQl229Reassessment(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('independent_handoff_exception_reassignment_review_draft');
    expect(recordQl229Reassignment(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'short')).toBe(ledger);
    expect(recordQl229Reassignment(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Invented invalid status must not be saved')).toBe(ledger);
    ledger = recordQl229Reassignment(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'MAINTAIN_HELD_REVIEW_DRAFT', 'Fictional reviewer reassignment mismatch');
    ledger = recordQl229Reassignment(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED', 'MAINTAIN_HELD_REVIEW_DRAFT', 'Invented accessibility decision still held');
    for (const check of QL229_CHECKS) ledger = acknowledgeQl229Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql229CompanyReassignment(sources, ledger, 'devilndove')).toMatchObject({
      unreviewed: 0, conflicting: 1, conflictEvents: 1, rechecksDue: 1 });
    expect(prepareQl229HoldReassessment(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl229Reassignment(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Fictional reviewer recheck referral remains unsent');
    ledger = prepareQl229HoldReassessment(sources, ledger, 'devilndove', 'inbox');
    expect(ql229CompanyReassignment(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, rechecksDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl229Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl229Reassignment(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_REASSIGNMENT_MATCH_UNVERIFIED', 'MAINTAIN_HELD_REVIEW_DRAFT', 'Prepared local packet is locked')).toBe(ledger);
  });

  it('ages independently reassigned handoffs and requires late independent review while retaining history', () => {
    const sources = reassignmentFixture('yw');
    let ledger = beginQl229Reassessment(sources, {}, 'yw', 'inbox');
    ledger = recordQl229Reassignment(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Imaginary repair reassignment under review');
    ledger = recordQl229Reassignment(sources, ledger, 'yw', 'inbox', 'accessibility',
      'REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED', 'MAINTAIN_HELD_REVIEW_DRAFT', 'Fictional accessibility handoff held');
    for (let i = 0; i < 2; i++) ledger = advanceQl229Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql229CompanyReassignment(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl229Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql229CompanyReassignment(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl229Reassignment(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_REASSIGNMENT_MATCH_UNVERIFIED', 'MAINTAIN_HELD_REVIEW_DRAFT',
      'Late fictional review cannot avoid independent recheck')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl229Reassignment(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_REASSIGNMENT_MATCH_UNVERIFIED',
      'REFER_INDEPENDENT_RECHECK_DRAFT', `Invented ${category} overdue independent reassessment`);
    expect(ql229CompanyReassignment(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueEpisodes: 2, rechecksDue: 0 });
    for (const check of QL229_CHECKS) ledger = acknowledgeQl229Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl229HoldReassessment(sources, ledger, 'yw', 'inbox');
    expect(ql229Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueEpisodes: 2, actualIndependentReassignment: false, externalWrites: 0 });
  });

  it('counts simulated reassignment conflict only once per gap and fictional cycle', () => {
    const sources = reassignmentFixture('rosiedazzlers');
    let ledger = beginQl229Reassessment(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl229Reassignment(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'First invented handoff conflict');
    ledger = recordQl229Reassignment(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Revised invented conflict in same cycle');
    expect(ql229CompanyReassignment(sources, ledger, 'rosiedazzlers').conflictEvents).toBe(1);
    ledger = advanceQl229Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl229Reassignment(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Later invented reassignment mismatch');
    expect(ql229CompanyReassignment(sources, ledger, 'rosiedazzlers').conflictEvents).toBe(2);
  });

  it('freezes revised upstream evidence and resets only one company case without closing orphans', () => {
    const a = reassignmentFixture('rosiedazzlers');
    const b = reassignmentFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql229Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql229Sources;
    let ledger = beginQl229Reassessment(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl229Reassessment(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql229Sources = { ...sources, handoffContinuity: { ...sources.handoffContinuity, icamp: {
      ...sources.handoffContinuity.icamp, inbox: { ...sources.handoffContinuity.icamp?.inbox!, gaps: {
        ...sources.handoffContinuity.icamp?.inbox?.gaps, actual_repair: {
          ...sources.handoffContinuity.icamp?.inbox?.gaps.actual_repair!, note: 'Changed fictional QL-228 independent follow-up note' } } } } } };
    expect(ql229CompanyReassignment(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL228_HANDOFF_OUTCOME_REVISED');
    expect(recordQl229Reassignment(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT', 'Cannot alter stale evidence')).toBe(ledger);
    ledger = beginQl229Reassessment(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql229CompanyReassignment(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql229Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql229CompanyReassignment(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl229Reassessment(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports coded statuses only without private notes, revision fingerprints or reviewer identities', () => {
    const sources = reassignmentFixture('icamp');
    let ledger = beginQl229Reassessment(sources, {}, 'icamp', 'inbox');
    ledger = recordQl229Reassignment(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED', 'REFER_INDEPENDENT_RECHECK_DRAFT',
      'Secret imaginary reviewer comments should never enter audit export');
    const receipt = ql229CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret imaginary reviewer comments');
    expect(receipt).not.toContain('fictional-reassignment-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-229 operator reassignment outcome and conditional hold interface', () => {
  it('shows new navigation, held release matrix, help, source links and privacy-minimized receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Reassignment aging & hold reassessment', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql229-release="${QL229_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Reassignment & hold help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-229 reassessment receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-229 reassignment receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql229-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares locally only after two gap outcomes, independent draft and UNVERIFIED checks', async () => {
    const sources = reassignmentFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql229Ledger>({});
      return <Ql229ReassignmentAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional reassignment outcome & held-release reassessment');
    await select('#ql229-outcome', 'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED');
    await select('#ql229-followup', 'REFER_INDEPENDENT_RECHECK_DRAFT');
    await type('#ql229-note', 'Invented independent handoff conflict with no real reviewer');
    await click('Record fictional reassignment & independent review · UNSENT');
    await select('#ql229-gap', 'accessibility');
    await select('#ql229-outcome', 'REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED');
    await select('#ql229-followup', 'MAINTAIN_HELD_REVIEW_DRAFT');
    await type('#ql229-note', 'Fictional accessibility reassignment outcome remains held');
    await click('Record fictional reassignment & independent review · UNSENT');
    for (const check of QL229_CHECKS) await click('Acknowledge reassessment · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare reassignment & conditional hold reassessment packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare reassignment & conditional hold reassessment packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-229 reassessment receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-229 reassignment receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented independent handoff conflict');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function reviewerContinuityFixture(company: OrganizationId, recurring = false): Ql230Sources {
  const sources = reassignmentFixture(company, recurring);
  let reassignmentAudit = beginQl229Reassessment(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reassignmentAudit = recordQl229Reassignment(
    sources, reassignmentAudit, company, 'inbox', category,
    category === 'actual_repair' ? 'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED' : 'REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_RECHECK_DRAFT' : 'MAINTAIN_HELD_REVIEW_DRAFT',
    `Fictional QL-229 ${category} reassignment outcome remains unverified`);
  for (const check of QL229_CHECKS) reassignmentAudit = acknowledgeQl229Check(sources, reassignmentAudit,
    company, 'inbox', check.id);
  reassignmentAudit = prepareQl229HoldReassessment(sources, reassignmentAudit, company, 'inbox');
  expect(reassignmentAudit[company]?.inbox?.phase).toBe('conditional_hold_reassessment_packet_prepared');
  return { ...sources, reassignmentAudit };
}

describe('QL-230 four-company recurrence and independent reviewer decision aging contract', () => {
  it('preserves twelve actual holds, four company boundaries and zero real communication or writes', () => {
    const empty: Ql230Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {},
      handoffContinuity: {}, reassignmentAudit: {} };
    const portfolio = ql230Portfolio(empty, {});
    expect(portfolio.companies.map((item) => item.company)).toEqual(operatorOrganizations.map((item) => item.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL230_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReview: false, actualEvidenceVerified: false,
      actualOwnerAuthorization: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl230ReviewerReview(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl230HoldAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires prepared QL-229, all follow-up outcomes, separate-review referrals and three held checks', () => {
    const sources = reviewerContinuityFixture('devilndove', true);
    let ledger = beginQl230ReviewerReview(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('reassignment_recurrence_reviewer_decision_draft');
    expect(recordQl230Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'short')).toBe(ledger);
    expect(recordQl230Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_SEPARATE_REVIEWER_DRAFT', 'Imaginary invalid review status')).toBe(ledger);
    ledger = recordQl230Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'CONTINUE_REVIEW_HELD_DRAFT', 'Imagined recurring repaired evidence');
    ledger = recordQl230Decision(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED', 'CONTINUE_REVIEW_HELD_DRAFT', 'Imagined accessible case remains unresolved');
    expect(ql230CompanyReview(sources, ledger, 'devilndove')).toMatchObject({
      unreviewed: 0, recurring: 1, recurrenceEvents: 1, separateReviewsDue: 1 });
    for (const check of QL230_CHECKS) ledger = acknowledgeQl230Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(prepareQl230HoldAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl230Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'Invented separate review referral not transmitted');
    ledger = prepareQl230HoldAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql230CompanyReview(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, separateReviewsDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl230Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl230Decision(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_FOLLOWUP_MATCH_UNVERIFIED', 'CONTINUE_REVIEW_HELD_DRAFT', 'Prepared packet cannot change')).toBe(ledger);
  });

  it('ages independent decisions at cycle two and three, preserving late history and referral requirements', () => {
    const sources = reviewerContinuityFixture('yw');
    let ledger = beginQl230ReviewerReview(sources, {}, 'yw', 'inbox');
    ledger = recordQl230Decision(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'Imaginary repair review referral');
    ledger = recordQl230Decision(sources, ledger, 'yw', 'inbox', 'accessibility',
      'REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED', 'CONTINUE_REVIEW_HELD_DRAFT', 'Imaginary accessible review held');
    for (let i = 0; i < 2; i++) ledger = advanceQl230Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql230CompanyReview(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl230Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql230CompanyReview(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl230Decision(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_FOLLOWUP_MATCH_UNVERIFIED', 'CONTINUE_REVIEW_HELD_DRAFT',
      'Fictional overdue independent review cannot bypass separate referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl230Decision(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_FOLLOWUP_MATCH_UNVERIFIED',
      'REFER_SEPARATE_REVIEWER_DRAFT', `Imagined ${category} overdue independent reviewer decision`);
    expect(ql230CompanyReview(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueReviewerDecisions: 2, separateReviewsDue: 0 });
    for (const check of QL230_CHECKS) ledger = acknowledgeQl230Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl230HoldAudit(sources, ledger, 'yw', 'inbox');
    expect(ql230Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueReviewerDecisions: 2, actualIndependentReview: false, externalWrites: 0 });
  });

  it('counts recurrence once per gap per cycle without inflating a same-cycle follow-up', () => {
    const sources = reviewerContinuityFixture('rosiedazzlers');
    let ledger = beginQl230ReviewerReview(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = recordQl230Decision(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'First invented recurrence');
    ledger = recordQl230Decision(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'Revised invention same cycle');
    expect(ql230CompanyReview(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(1);
    ledger = advanceQl230Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl230Decision(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'Later invented recurrence');
    expect(ql230CompanyReview(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(2);
  });

  it('freezes changed QL-229 reassignment evidence while preserving other company and orphan holds', () => {
    const a = reviewerContinuityFixture('rosiedazzlers');
    const b = reviewerContinuityFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql230Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql230Sources;
    let ledger = beginQl230ReviewerReview(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl230ReviewerReview(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql230Sources = { ...sources, reassignmentAudit: { ...sources.reassignmentAudit, icamp: {
      ...sources.reassignmentAudit.icamp, inbox: { ...sources.reassignmentAudit.icamp?.inbox!, gaps: {
        ...sources.reassignmentAudit.icamp?.inbox?.gaps, actual_repair: {
          ...sources.reassignmentAudit.icamp?.inbox?.gaps.actual_repair!, note: 'Invented revised QL-229 handoff evidence note' } } } } } };
    expect(ql230CompanyReview(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL229_REASSIGNMENT_REVISED');
    expect(recordQl230Decision(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT', 'Cannot revise stale follow-up')).toBe(ledger);
    ledger = beginQl230ReviewerReview(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql230CompanyReview(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql230Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql230CompanyReview(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl230ReviewerReview(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports status-only held receipts without fictional private notes or source fingerprints', () => {
    const sources = reviewerContinuityFixture('icamp');
    let ledger = beginQl230ReviewerReview(sources, {}, 'icamp', 'inbox');
    ledger = recordQl230Decision(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED', 'REFER_SEPARATE_REVIEWER_DRAFT',
      'Secret fictional independent reviewer note must never appear in receipt');
    const receipt = ql230CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"reviewerIdentitiesIncluded": false');
    expect(receipt).not.toContain('Secret fictional independent reviewer note');
    expect(receipt).not.toContain('fictional-reviewer-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-230 four-company reviewer follow-up recurrence and hold continuity interface', () => {
  it('renders navigation, twelve held prerequisites, contextual help and redacted receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Reviewer recurrence & hold continuity', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql230-release="${QL230_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Reviewer recurrence help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-230 continuity receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-230 reviewer continuity receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql230-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares a held fictional reviewer audit only after gap outcomes and checks', async () => {
    const sources = reviewerContinuityFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql230Ledger>({});
      return <Ql230ReviewerContinuityAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional reviewer decision aging & recurrence review');
    await select('#ql230-outcome', 'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED');
    await select('#ql230-decision', 'REFER_SEPARATE_REVIEWER_DRAFT');
    await type('#ql230-note', 'Fictional repair evidence repeated and needs an unsent separate reviewer');
    await click('Record fictional follow-up & reviewer decision · UNSENT');
    await select('#ql230-gap', 'accessibility');
    await select('#ql230-outcome', 'REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED');
    await select('#ql230-decision', 'CONTINUE_REVIEW_HELD_DRAFT');
    await type('#ql230-note', 'Fictional accessibility evidence remains held and unverified');
    await click('Record fictional follow-up & reviewer decision · UNSENT');
    for (const check of QL230_CHECKS) await click('Acknowledge hold continuity · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare reviewer decision & hold continuity packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare reviewer decision & hold continuity packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-230 continuity receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-230 reviewer continuity receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Fictional repair evidence repeated');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function ql231Fixture(company: OrganizationId, recurring = false): Ql231Sources {
  const sources = reviewerContinuityFixture(company, recurring);
  let reviewerContinuity = beginQl230ReviewerReview(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reviewerContinuity = recordQl230Decision(
    sources, reviewerContinuity, company, 'inbox', category,
    category === 'actual_repair' ? 'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED' : 'REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_SEPARATE_REVIEWER_DRAFT' : 'CONTINUE_REVIEW_HELD_DRAFT',
    `Invented QL-230 ${category} reviewer follow-up remains unverified`);
  for (const check of QL230_CHECKS) reviewerContinuity = acknowledgeQl230Check(sources, reviewerContinuity,
    company, 'inbox', check.id);
  reviewerContinuity = prepareQl230HoldAudit(sources, reviewerContinuity, company, 'inbox');
  expect(reviewerContinuity[company]?.inbox?.phase).toBe('conditional_hold_continuity_audit_prepared');
  return { ...sources, reviewerContinuity };
}

describe('QL-231 four-company reviewer recurrence disposition and overdue evidence recheck contract', () => {
  it('keeps all twelve real holds, four independent company scopes and zero external activity', () => {
    const empty: Ql231Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {}, handoff: {},
      reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {}, exception: {},
      aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {},
      handoffContinuity: {}, reassignmentAudit: {}, reviewerContinuity: {} };
    const portfolio = ql231Portfolio(empty, {});
    expect(portfolio.companies.map((item) => item.company)).toEqual(operatorOrganizations.map((item) => item.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL231_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentDisposition: false,
      actualEvidenceVerified: false, actualOwnerAuthorization: false, livePilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl231Disposition(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl231Oversight(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current QL-230, coded dispositions, separate rechecks and all held-review checks', () => {
    const sources = ql231Fixture('devilndove', true);
    let ledger = beginQl231Disposition(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('reviewer_recurrence_disposition_recheck_draft');
    expect(recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'short')).toBe(ledger);
    expect(recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REOPEN_EVIDENCE_EXCEPTION_DRAFT', 'REFER_SEPARATE_RECHECK_DRAFT',
      'Fictional invalid recheck outcome')).toBe(ledger);
    expect(recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'CONTINUE_HELD_REVIEW_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Cannot leave recurring exception undispositioned')).toBe(ledger);
    ledger = recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
      'RECHECK_MONITOR_HELD_DRAFT', 'Fictional repair evidence recurred again');
    ledger = recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'EVIDENCE_RECHECK_PENDING_UNVERIFIED', 'CONTINUE_HELD_REVIEW_DRAFT',
      'RECHECK_MONITOR_HELD_DRAFT', 'Fictional accessibility evidence still pending');
    expect(ql231CompanyDisposition(sources, ledger, 'devilndove')).toMatchObject({
      recurring: 1, recurrenceEvents: 1, unreviewed: 0, separateRechecksDue: 1 });
    for (const check of QL231_CHECKS) ledger = acknowledgeQl231Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(prepareQl231Oversight(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Fictional separate recheck referral not transmitted');
    ledger = prepareQl231Oversight(sources, ledger, 'devilndove', 'inbox');
    expect(ql231CompanyDisposition(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, separateRechecksDue: 0, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl231Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl231Recheck(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_RECHECK_MATCH_UNVERIFIED', 'CONTINUE_HELD_REVIEW_DRAFT',
      'RECHECK_MONITOR_HELD_DRAFT', 'Prepared fictional packet is locked')).toBe(ledger);
  });

  it('ages rechecks independently and retains overdue history after escalation', () => {
    const sources = ql231Fixture('yw');
    let ledger = beginQl231Disposition(sources, {}, 'yw', 'inbox');
    ledger = recordQl231Recheck(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'EVIDENCE_RECHECK_PENDING_UNVERIFIED', 'REFER_FURTHER_INDEPENDENT_REVIEW_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Invented independent repair recheck referral');
    ledger = recordQl231Recheck(sources, ledger, 'yw', 'inbox', 'accessibility',
      'EVIDENCE_RECHECK_PENDING_UNVERIFIED', 'CONTINUE_HELD_REVIEW_DRAFT',
      'RECHECK_MONITOR_HELD_DRAFT', 'Imaginary accessible recheck held');
    for (let i = 0; i < 2; i++) ledger = advanceQl231Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql231CompanyDisposition(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl231Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql231CompanyDisposition(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl231Recheck(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_RECHECK_MATCH_UNVERIFIED', 'CONTINUE_HELD_REVIEW_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Late independent review requires overdue escalation')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl231Recheck(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_RECHECK_MATCH_UNVERIFIED',
      'REFER_FURTHER_INDEPENDENT_REVIEW_DRAFT', 'ESCALATE_OVERDUE_RECHECK_DRAFT',
      `Fictional ${category} overdue recheck escalated without delivery`);
    expect(ql231CompanyDisposition(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueRecheckEpisodes: 2, separateRechecksDue: 0 });
    for (const check of QL231_CHECKS) ledger = acknowledgeQl231Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl231Oversight(sources, ledger, 'yw', 'inbox');
    expect(ql231Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueRecheckEpisodes: 2, actualIndependentDisposition: false, externalWrites: 0 });
  });

  it('counts identical recurring evidence once per gap per simulated cycle', () => {
    const sources = ql231Fixture('rosiedazzlers');
    let ledger = beginQl231Disposition(sources, {}, 'rosiedazzlers', 'inbox');
    for (const note of ['Invented first recurring evidence exception', 'Invented changed same-cycle exception'])
      ledger = recordQl231Recheck(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
        'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
        'REFER_SEPARATE_RECHECK_DRAFT', note);
    expect(ql231CompanyDisposition(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(1);
    ledger = advanceQl231Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl231Recheck(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Invented later cycle exception remains unresolved');
    expect(ql231CompanyDisposition(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(2);
  });

  it('freezes changed QL-230 evidence and isolates case-only reset and orphaned records', () => {
    const a = ql231Fixture('rosiedazzlers');
    const b = ql231Fixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql231Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql231Sources;
    let ledger = beginQl231Disposition(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl231Disposition(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql231Sources = { ...sources, reviewerContinuity: { ...sources.reviewerContinuity, icamp: {
      ...sources.reviewerContinuity.icamp, inbox: { ...sources.reviewerContinuity.icamp?.inbox!, gaps: {
        ...sources.reviewerContinuity.icamp?.inbox?.gaps, actual_repair: {
          ...sources.reviewerContinuity.icamp?.inbox?.gaps.actual_repair!, note: 'Revised invented independent reviewer note' } } } } } };
    expect(ql231CompanyDisposition(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL230_REVIEWER_OUTCOME_REVISED');
    expect(recordQl231Recheck(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Cannot mutate stale recheck evidence')).toBe(ledger);
    ledger = beginQl231Disposition(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql231CompanyDisposition(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql231Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql231CompanyDisposition(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl231Disposition(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('redacts reviewer identities, local notes and source tokens from held-recheck receipts', () => {
    const sources = ql231Fixture('icamp');
    let ledger = beginQl231Disposition(sources, {}, 'icamp', 'inbox');
    ledger = recordQl231Recheck(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT',
      'REFER_SEPARATE_RECHECK_DRAFT', 'Secret fictional reviewer recheck notes must not be exported');
    const receipt = ql231CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Secret fictional reviewer recheck notes');
    expect(receipt).not.toContain('fictional-disposition-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-231 four-company reviewer recurrence disposition and hold exception operator UI', () => {
  it('shows four-company navigation, all release holds, help, source and privacy-minimized receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Reviewer disposition & evidence recheck', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql231-release="${QL231_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Disposition & hold help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-231 oversight receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-231 disposition oversight receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql231-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares only reconciled fictional dispositions with independent recheck drafts and all checks', async () => {
    const sources = ql231Fixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql231Ledger>({});
      return <Ql231DispositionOversight organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional recurrence disposition & overdue evidence recheck');
    await select('#ql231-evidence', 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED');
    await select('#ql231-disposition', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT');
    await select('#ql231-recheck', 'REFER_SEPARATE_RECHECK_DRAFT');
    await type('#ql231-note', 'Fictional repeated repair exception needs an unsent separate recheck');
    await click('Record fictional disposition & evidence recheck · UNSENT');
    await select('#ql231-gap', 'accessibility');
    await select('#ql231-evidence', 'EVIDENCE_RECHECK_PENDING_UNVERIFIED');
    await select('#ql231-disposition', 'CONTINUE_HELD_REVIEW_DRAFT');
    await select('#ql231-recheck', 'RECHECK_MONITOR_HELD_DRAFT');
    await type('#ql231-note', 'Invented accessibility recheck outcome still not independently verified');
    await click('Record fictional disposition & evidence recheck · UNSENT');
    for (const check of QL231_CHECKS) await click('Acknowledge disposition hold · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare disposition & hold exception oversight packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare disposition & hold exception oversight packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-231 oversight receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-231 disposition oversight receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Fictional repeated repair exception');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function escalationProofFixture(company: OrganizationId, recurring = false): Ql232Sources {
  const sources = ql231Fixture(company, recurring);
  let dispositionOversight = beginQl231Disposition(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) dispositionOversight = recordQl231Recheck(
    sources, dispositionOversight, company, 'inbox', category,
    category === 'actual_repair' ? 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED' : 'EVIDENCE_RECHECK_PENDING_UNVERIFIED',
    category === 'actual_repair' ? 'REOPEN_EVIDENCE_EXCEPTION_DRAFT' : 'CONTINUE_HELD_REVIEW_DRAFT',
    category === 'actual_repair' ? 'REFER_SEPARATE_RECHECK_DRAFT' : 'RECHECK_MONITOR_HELD_DRAFT',
    `Fictional QL-231 ${category} independent disposition remains unverified`);
  for (const check of QL231_CHECKS) dispositionOversight = acknowledgeQl231Check(sources,
    dispositionOversight, company, 'inbox', check.id);
  dispositionOversight = prepareQl231Oversight(sources, dispositionOversight, company, 'inbox');
  expect(dispositionOversight[company]?.inbox?.phase).toBe('conditional_hold_exception_oversight_packet_prepared');
  return { ...sources, dispositionOversight };
}

describe('QL-232 four-company escalation outcome and conditional hold proof contract', () => {
  it('preserves four companies, all twelve real holds and zero external writes or calls', () => {
    const empty: Ql232Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {},
      handoffContinuity: {}, reassignmentAudit: {}, reviewerContinuity: {}, dispositionOversight: {} };
    const portfolio = ql232Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL232_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentDisposition: false, actualHoldProofVerified: false,
      actualOwnerAuthorization: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl232ProofReview(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl232HeldProof(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current prepared QL-231, reconciled proof, independent referrals and all checks', () => {
    const sources = escalationProofFixture('devilndove', true);
    let ledger = beginQl232ProofReview(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('overdue_escalation_disposition_proof_review_draft');
    expect(recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'short')).toBe(ledger);
    expect(recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Invalid fictional escalation cannot be saved')).toBe(ledger);
    expect(recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED', 'Recurring proof gap requires independent disposition')).toBe(ledger);
    ledger = recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Invented repair escalation remains held');
    ledger = recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'ESCALATION_OUTCOME_PENDING_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'HOLD_PROOF_REVALIDATION_PENDING_UNVERIFIED', 'Imaginary accessibility proof pending');
    expect(ql232CompanyProof(sources, ledger, 'devilndove')).toMatchObject({
      unreviewed: 1, missingDispositions: 0, recurring: 0 });
    // Fully reconcile inherited P0 and recurring repair risk; a held proof gap can be recorded but never releases holds.
    ledger = recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED', 'Invented independent escalation referral not transmitted');
    expect(ql232CompanyProof(sources, ledger, 'devilndove')).toMatchObject({
      unreviewed: 0, recurring: 1, recurrenceEvents: 1, proofGaps: 1, missingDispositions: 0 });
    for (const check of QL232_CHECKS) ledger = acknowledgeQl232Check(sources, ledger, 'devilndove', 'inbox', check.id);
    ledger = prepareQl232HeldProof(sources, ledger, 'devilndove', 'inbox');
    expect(ql232CompanyProof(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(recordQl232Outcome(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Cannot change prepared case')).toBe(ledger);
  });

  it('ages fictional independent dispositions and retains overdue history after a new referral', () => {
    const sources = escalationProofFixture('yw');
    let ledger = beginQl232ProofReview(sources, {}, 'yw', 'inbox');
    ledger = recordQl232Outcome(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'ESCALATION_OUTCOME_PENDING_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'HOLD_PROOF_REVALIDATION_PENDING_UNVERIFIED', 'Imaginary repair evidence escalation pending');
    ledger = recordQl232Outcome(sources, ledger, 'yw', 'inbox', 'accessibility',
      'ESCALATION_OUTCOME_PENDING_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Imaginary accessibility held proof checked');
    for (let i = 0; i < 2; i++) ledger = advanceQl232Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql232CompanyProof(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl232Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql232CompanyProof(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl232Outcome(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Late fictional evidence must be referred')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl232Outcome(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED',
      'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT', 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED',
      `Fictional ${category} late disposition referred without delivery`);
    expect(ql232CompanyProof(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueDispositionEpisodes: 2, missingDispositions: 0 });
    for (const check of QL232_CHECKS) ledger = acknowledgeQl232Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl232HeldProof(sources, ledger, 'yw', 'inbox');
    expect(ql232Portfolio(sources, ledger)).toMatchObject({
      prepared: 1, overdueDispositionEpisodes: 2, actualHoldProofVerified: false, externalWrites: 0 });
  });

  it('counts a recurring disposition once per evidence gap and simulated cycle', () => {
    const sources = escalationProofFixture('rosiedazzlers');
    let ledger = beginQl232ProofReview(sources, {}, 'rosiedazzlers', 'inbox');
    for (const note of ['Invented independent recurrence first', 'Invented second edit in same cycle'])
      ledger = recordQl232Outcome(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
        'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REOPEN_ESCALATION_EXCEPTION_DRAFT',
        'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', note);
    expect(ql232CompanyProof(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(1);
    ledger = advanceQl232Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl232Outcome(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Imaginary later cycle escalation exception');
    expect(ql232CompanyProof(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(2);
  });

  it('freezes revised QL-231 source and altered hold-proof tokens without touching other companies', () => {
    const a = escalationProofFixture('rosiedazzlers');
    const b = escalationProofFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql232Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql232Sources;
    let ledger = beginQl232ProofReview(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl232ProofReview(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql232Sources = { ...sources, dispositionOversight: { ...sources.dispositionOversight, icamp: {
      ...sources.dispositionOversight.icamp, inbox: { ...sources.dispositionOversight.icamp?.inbox!, gaps: {
        ...sources.dispositionOversight.icamp?.inbox?.gaps, actual_repair: {
          ...sources.dispositionOversight.icamp?.inbox?.gaps.actual_repair!, note: 'Changed fictional QL-231 evidence note' } } } } } };
    expect(ql232CompanyProof(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL231_DISPOSITION_REVISED');
    expect(recordQl232Outcome(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Must not alter frozen case')).toBe(ledger);
    ledger = beginQl232ProofReview(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql232CompanyProof(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const tampered: Ql232Ledger = { ...ledger, icamp: { ...ledger.icamp, inbox: {
      ...ledger.icamp?.inbox!, proofToken: 'not-a-matching-held-proof-token' } } };
    expect(ql232CompanyProof(revised, tampered, 'icamp').cases[0].sourceStatus).toBe('HOLD_PROOF_REVISED');
    expect(prepareQl232HeldProof(revised, tampered, 'icamp', 'inbox')).toBe(tampered);
    const removed: Ql232Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql232CompanyProof(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl232ProofReview(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports only held status without fictional private notes, source tokens or reviewer names', () => {
    const sources = escalationProofFixture('icamp');
    let ledger = beginQl232ProofReview(sources, {}, 'icamp', 'inbox');
    ledger = recordQl232Outcome(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED', 'Secret imaginary reviewer details must not leave session');
    const receipt = ql232CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"proofTokensIncluded": false');
    expect(receipt).not.toContain('Secret imaginary reviewer details');
    expect(receipt).not.toContain('fictional-proof-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-232 four-company escalation outcome and held proof operator UI', () => {
  it('shows navigation, four-company hold matrix, help, source and redacted proof receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Escalation outcomes & held proof', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql232-release="${QL232_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Escalation & proof help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-232 held proof receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-232 held proof receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql232-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares local held proof only after both gap outcomes, independent referral and checks', async () => {
    const sources = escalationProofFixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql232Ledger>({});
      return <Ql232EscalationProofAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional escalation outcome & held proof revalidation');
    await select('#ql232-escalation', 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED');
    await select('#ql232-disposition', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT');
    await select('#ql232-proof', 'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED');
    await type('#ql232-note', 'Invented repair escalation remains unverified with a proof gap');
    await click('Record fictional escalation & hold proof · UNSENT');
    await select('#ql232-gap', 'accessibility');
    await select('#ql232-escalation', 'ESCALATION_OUTCOME_PENDING_UNVERIFIED');
    await select('#ql232-disposition', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT');
    await select('#ql232-proof', 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED');
    await type('#ql232-note', 'Imaginary accessibility proof continues to be held for review');
    await click('Record fictional escalation & hold proof · UNSENT');
    for (const check of QL232_CHECKS) await click('Acknowledge held proof · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare escalation & held proof revalidation packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare escalation & held proof revalidation packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-232 held proof receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-232 held proof receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented repair escalation remains unverified');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function heldPilotIntegrityFixture(company: OrganizationId): Ql233Sources {
  const sources = escalationProofFixture(company);
  let escalationProof = beginQl232ProofReview(sources, {}, company, 'inbox');
  escalationProof = recordQl232Outcome(sources, escalationProof, company, 'inbox', 'actual_repair',
    'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
    'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Fictional escalation reviewed without contact');
  escalationProof = recordQl232Outcome(sources, escalationProof, company, 'inbox', 'accessibility',
    'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
    'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Fictional accessible proof remains held');
  for (const check of QL232_CHECKS) escalationProof = acknowledgeQl232Check(sources,
    escalationProof, company, 'inbox', check.id);
  escalationProof = prepareQl232HeldProof(sources, escalationProof, company, 'inbox');
  expect(escalationProof[company]?.inbox?.phase).toBe('held_proof_revalidation_packet_prepared');
  return { ...sources, escalationProof };
}

describe('QL-233 four-company exception follow-up, independent reassessment and held-pilot integrity', () => {
  it('holds all four companies and twelve real pilot gates without side effects or source evidence', () => {
    const empty: Ql233Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {},
      handoffContinuity: {}, reassignmentAudit: {}, reviewerContinuity: {}, dispositionOversight: {},
      escalationProof: {} };
    const portfolio = ql233Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL233_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentDecision: false,
      actualPilotProofVerified: false, actualOwnerAuthorization: false, livePilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl233IntegrityAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl233HeldAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current prepared QL-232, complete follow-ups, independent decisions and fresh checks', () => {
    const sources = heldPilotIntegrityFixture('devilndove');
    let ledger = beginQl233IntegrityAudit(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('exception_follow_up_integrity_review_draft');
    expect(recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'short')).toBe(ledger);
    expect(recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'BAD_FOLLOW_UP' as never, 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Imagined forbidden follow-up')).toBe(ledger);
    expect(recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'MAINTAIN_HELD_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Recurring proof needs independent review')).toBe(ledger);
    ledger = recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Fictional independent decision draft not sent');
    ledger = recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'FOLLOW_UP_PENDING_UNVERIFIED', 'MAINTAIN_HELD_DECISION_DRAFT',
      'HELD_PILOT_PROOF_PENDING_UNVERIFIED', 'Imaginary accessibility evidence still pending');
    expect(ql233CompanyIntegrity(sources, ledger, 'devilndove')).toMatchObject({
      unreviewed: 1, recurrenceEvents: 1, missingReassessments: 0 });
    for (const check of QL233_CHECKS) ledger = acknowledgeQl233Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(prepareQl233HeldAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', 'MAINTAIN_HELD_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Imaginary accessibility decision remained held');
    expect(ql233CompanyIntegrity(sources, ledger, 'devilndove').cases[0].checksComplete).toBe(false);
    for (const check of QL233_CHECKS) ledger = acknowledgeQl233Check(sources, ledger, 'devilndove', 'inbox', check.id);
    ledger = prepareQl233HeldAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql233CompanyIntegrity(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, holdAudit: { held: 12, allHeld: true, pilotRelease: 'BLOCKED' } });
    expect(recordQl233FollowUp(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REOPEN_INDEPENDENT_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Prepared packet cannot be edited')).toBe(ledger);
  });

  it('ages follow-up from due soon to overdue; new unsent referral preserves late history', () => {
    const sources = heldPilotIntegrityFixture('yw');
    let ledger = beginQl233IntegrityAudit(sources, {}, 'yw', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl233FollowUp(
      sources, ledger, 'yw', 'inbox', category,
      'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', category === 'actual_repair' ?
        'REFER_INDEPENDENT_REASSESSMENT_DRAFT' : 'MAINTAIN_HELD_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Fictional follow-up draft remains private');
    for (let i = 0; i < 2; i++) ledger = advanceQl233Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql233CompanyIntegrity(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl233Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql233CompanyIntegrity(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl233FollowUp(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', 'MAINTAIN_HELD_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Overdue requires new independent referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl233FollowUp(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED',
      'REFER_INDEPENDENT_REASSESSMENT_DRAFT', 'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED',
      'Fictional overdue reassessment referred but not sent');
    expect(ql233CompanyIntegrity(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, historicalOverdueEpisodes: 2, missingReassessments: 0 });
    for (const check of QL233_CHECKS) ledger = acknowledgeQl233Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl233HeldAudit(sources, ledger, 'yw', 'inbox');
    expect(ql233Portfolio(sources, ledger)).toMatchObject({ prepared: 1, externalWrites: 0 });
  });

  it('tracks only one exception recurrence per gap and cycle and invalidates checklist on cycle change', () => {
    const sources = heldPilotIntegrityFixture('rosiedazzlers');
    let ledger = beginQl233IntegrityAudit(sources, {}, 'rosiedazzlers', 'inbox');
    for (const note of ['Imaginary recurrence first', 'Second edit of same fictional recurrence']) ledger =
      recordQl233FollowUp(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
        'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REOPEN_INDEPENDENT_DECISION_DRAFT',
        'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', note);
    expect(ql233CompanyIntegrity(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(1);
    for (const check of QL233_CHECKS) ledger = acknowledgeQl233Check(sources, ledger, 'rosiedazzlers', 'inbox', check.id);
    ledger = advanceQl233Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    expect(ql233CompanyIntegrity(sources, ledger, 'rosiedazzlers').cases[0].checksComplete).toBe(false);
    ledger = recordQl233FollowUp(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Later imaginary recurrence referred again');
    expect(ql233CompanyIntegrity(sources, ledger, 'rosiedazzlers').recurrenceEvents).toBe(2);
  });

  it('blocks integrity exceptions and pending proof even with all acknowledgements', () => {
    const sources = heldPilotIntegrityFixture('icamp');
    let ledger = beginQl233IntegrityAudit(sources, {}, 'icamp', 'inbox');
    ledger = recordQl233FollowUp(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED', 'Fictional pilot integrity still discrepant');
    ledger = recordQl233FollowUp(sources, ledger, 'icamp', 'inbox', 'accessibility',
      'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', 'MAINTAIN_HELD_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Imaginary held pilot integrity matched');
    for (const check of QL233_CHECKS) ledger = acknowledgeQl233Check(sources, ledger, 'icamp', 'inbox', check.id);
    expect(ql233CompanyIntegrity(sources, ledger, 'icamp')).toMatchObject({ integrityExceptions: 1, prepared: 0 });
    expect(prepareQl233HeldAudit(sources, ledger, 'icamp', 'inbox')).toBe(ledger);
    ledger = recordQl233FollowUp(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Invented held pilot gap now checked locally');
    expect(ql233CompanyIntegrity(sources, ledger, 'icamp').integrityExceptions).toBe(0);
    expect(ql233CompanyIntegrity(sources, ledger, 'icamp').cases[0].checksComplete).toBe(false);
  });

  it('cannot hide an inherited QL-232 proof gap by recording a fictional QL-233 match', () => {
    const upstream = escalationProofFixture('icamp');
    let escalationProof = beginQl232ProofReview(upstream, {}, 'icamp', 'inbox');
    escalationProof = recordQl232Outcome(upstream, escalationProof, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT',
      'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED', 'Imaginary proof gap remained unresolved upstream');
    escalationProof = recordQl232Outcome(upstream, escalationProof, 'icamp', 'inbox', 'accessibility',
      'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED', 'MAINTAIN_INDEPENDENT_HOLD_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Imaginary accessibility proof still held');
    for (const check of QL232_CHECKS) escalationProof = acknowledgeQl232Check(upstream,
      escalationProof, 'icamp', 'inbox', check.id);
    escalationProof = prepareQl232HeldProof(upstream, escalationProof, 'icamp', 'inbox');
    const sources: Ql233Sources = { ...upstream, escalationProof };
    let ledger = beginQl233IntegrityAudit(sources, {}, 'icamp', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl233FollowUp(
      sources, ledger, 'icamp', 'inbox', category, 'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED',
      category === 'actual_repair' ? 'REFER_INDEPENDENT_REASSESSMENT_DRAFT' : 'MAINTAIN_HELD_DECISION_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Synthetic local hold proof looked consistent');
    for (const check of QL233_CHECKS) ledger = acknowledgeQl233Check(sources, ledger, 'icamp', 'inbox', check.id);
    expect(ql233CompanyIntegrity(sources, ledger, 'icamp')).toMatchObject({ integrityExceptions: 1, prepared: 0 });
    expect(prepareQl233HeldAudit(sources, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('freezes revised QL-232 source and altered proof snapshot; case-only reset preserves another company', () => {
    const a = heldPilotIntegrityFixture('rosiedazzlers');
    const b = heldPilotIntegrityFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql233Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql233Sources;
    let ledger = beginQl233IntegrityAudit(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl233IntegrityAudit(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql233Sources = { ...sources, escalationProof: { ...sources.escalationProof, icamp: {
      ...sources.escalationProof.icamp, inbox: { ...sources.escalationProof.icamp?.inbox!, gaps: {
        ...sources.escalationProof.icamp?.inbox?.gaps, actual_repair: {
          ...sources.escalationProof.icamp?.inbox?.gaps.actual_repair!, note: 'Changed fictional QL-232 follow-up evidence' } } } } } };
    expect(ql233CompanyIntegrity(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL232_ESCALATION_PROOF_REVISED');
    expect(recordQl233FollowUp(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Frozen case cannot record')).toBe(ledger);
    ledger = beginQl233IntegrityAudit(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql233CompanyIntegrity(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const tampered: Ql233Ledger = { ...ledger, icamp: { ...ledger.icamp, inbox: {
      ...ledger.icamp?.inbox!, holdToken: 'not-a-matching-held-pilot-token' } } };
    expect(ql233CompanyIntegrity(revised, tampered, 'icamp').cases[0].sourceStatus).toBe('HELD_PILOT_PROOF_REVISED');
    expect(prepareQl233HeldAudit(revised, tampered, 'icamp', 'inbox')).toBe(tampered);
    const removed: Ql233Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql233CompanyIntegrity(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl233IntegrityAudit(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports redacted held-pilot statuses without private notes or revision tokens', () => {
    const sources = heldPilotIntegrityFixture('icamp');
    let ledger = beginQl233IntegrityAudit(sources, {}, 'icamp', 'inbox');
    ledger = recordQl233FollowUp(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
      'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Secret imaginary reviewer details must not leave session');
    const receipt = ql233CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"pilotRelease": "BLOCKED"');
    expect(receipt).toContain('"holdTokensIncluded": false');
    expect(receipt).not.toContain('Secret imaginary reviewer details');
    expect(receipt).not.toContain('fictional-integrity-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-233 held-pilot integrity operator UI', () => {
  it('shows navigation, four-company matrix, help, QL-232 source and redacted local receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Exception follow-up & pilot integrity', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql233-release="${QL233_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Follow-up & integrity help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-233 held-pilot receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-233 held-pilot receipt"]')?.value ?? '';
    expect(receipt).toContain('"pilotRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql233-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  }, 15_000);

  it('prepares a local held-pilot audit after both evidence gaps, separate reassessment and fresh checks', async () => {
    const sources = heldPilotIntegrityFixture('rosiedazzlers');
    function Harness() {
      const [ledger, setLedger] = useState<Ql233Ledger>({});
      return <Ql233FollowUpIntegrityAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional exception follow-up & held-pilot audit');
    await select('#ql233-followup', 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED');
    await select('#ql233-reassessment', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT');
    await select('#ql233-integrity', 'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED');
    await type('#ql233-note', 'Imaginary independent escalation for held pilot');
    await click('Record fictional follow-up & held integrity · UNSENT');
    await select('#ql233-gap', 'accessibility');
    await select('#ql233-followup', 'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED');
    await select('#ql233-reassessment', 'MAINTAIN_HELD_DECISION_DRAFT');
    await type('#ql233-note', 'Imaginary accessibility evidence remains held');
    await click('Record fictional follow-up & held integrity · UNSENT');
    for (const check of QL233_CHECKS) await click('Acknowledge held-pilot integrity · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare fictional held-pilot integrity packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare fictional held-pilot integrity packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-233 held-pilot receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-233 held-pilot receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Imaginary independent escalation for held pilot');
    expect(receipt).toContain('"pilotRelease": "BLOCKED"');
  });
});

function sourceDriftFixture(company: OrganizationId): Ql234Sources {
  const sources = heldPilotIntegrityFixture(company);
  let followUpIntegrity = beginQl233IntegrityAudit(sources, {}, company, 'inbox');
  followUpIntegrity = recordQl233FollowUp(sources, followUpIntegrity, company, 'inbox', 'actual_repair',
    'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT',
    'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Fictional independent source review never dispatched');
  followUpIntegrity = recordQl233FollowUp(sources, followUpIntegrity, company, 'inbox', 'accessibility',
    'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', 'MAINTAIN_HELD_DECISION_DRAFT',
    'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'Imaginary accessibility follow-up remained held');
  for (const check of QL233_CHECKS) followUpIntegrity = acknowledgeQl233Check(sources,
    followUpIntegrity, company, 'inbox', check.id);
  followUpIntegrity = prepareQl233HeldAudit(sources, followUpIntegrity, company, 'inbox');
  expect(followUpIntegrity[company]?.inbox?.phase).toBe('held_pilot_integrity_audit_prepared');
  return { ...sources, followUpIntegrity };
}

describe('QL-234 source identity drift, independent follow-up continuity and conditional hold integrity', () => {
  it('protects four companies and all twelve actual holds with no real verification or external writes', () => {
    const empty: Ql234Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {},
      exception: {}, aging: {}, overdue: {}, disposition: {}, reopenReview: {}, evidenceAudit: {},
      handoffContinuity: {}, reassignmentAudit: {}, reviewerContinuity: {}, dispositionOversight: {},
      escalationProof: {}, followUpIntegrity: {} };
    const portfolio = ql234Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL234_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReassessment: false,
      actualSourceVerified: false, actualOwnerAuthorization: false, livePilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl234DriftAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl234HeldRecheck(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires current prepared QL-233, independent follow-up, drift closure and new checks', () => {
    const sources = sourceDriftFixture('devilndove');
    let ledger = beginQl234DriftAudit(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('source_drift_reassessment_continuity_draft');
    expect(recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'short')).toBe(ledger);
    expect(recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'NOT_A_REAL_SOURCE_STATE' as never, 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Invalid simulated source state')).toBe(ledger);
    expect(recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Drift requires independent follow-up')).toBe(ledger);
    ledger = recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Imaginary source drift exception remains held');
    ledger = recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED', 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Imaginary accessibility source matches');
    for (const check of QL234_CHECKS) ledger = acknowledgeQl234Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql234CompanyContinuity(sources, ledger, 'devilndove')).toMatchObject({ openDrift: 1, prepared: 0 });
    expect(prepareQl234HeldRecheck(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Imaginary source now reconciled without live verification');
    expect(ql234CompanyContinuity(sources, ledger, 'devilndove')).toMatchObject({
      openDrift: 0, driftEvents: 1, missingFollowUps: 0 });
    expect(ql234CompanyContinuity(sources, ledger, 'devilndove').cases[0].checksComplete).toBe(false);
    for (const check of QL234_CHECKS) ledger = acknowledgeQl234Check(sources, ledger, 'devilndove', 'inbox', check.id);
    ledger = prepareQl234HeldRecheck(sources, ledger, 'devilndove', 'inbox');
    expect(ql234CompanyContinuity(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(recordQl234Drift(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REOPEN_SOURCE_DRIFT_EXCEPTION_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Prepared held packet cannot be modified')).toBe(ledger);
  });

  it('counts drift once per gap per simulated cycle while independent follow-up remains mandatory', () => {
    const sources = sourceDriftFixture('rosiedazzlers');
    let ledger = beginQl234DriftAudit(sources, {}, 'rosiedazzlers', 'inbox');
    for (const note of ['First imaginary drift event', 'Repeated edit within one drift cycle']) ledger =
      recordQl234Drift(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
        'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REOPEN_SOURCE_DRIFT_EXCEPTION_DRAFT',
        'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', note);
    expect(ql234CompanyContinuity(sources, ledger, 'rosiedazzlers')).toMatchObject({ driftEvents: 1, openDrift: 1 });
    for (const check of QL234_CHECKS) ledger = acknowledgeQl234Check(sources, ledger, 'rosiedazzlers', 'inbox', check.id);
    ledger = advanceQl234Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    expect(ql234CompanyContinuity(sources, ledger, 'rosiedazzlers').cases[0].checksComplete).toBe(false);
    ledger = recordQl234Drift(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Later independent synthetic source drift event');
    expect(ql234CompanyContinuity(sources, ledger, 'rosiedazzlers').driftEvents).toBe(2);
  });

  it('moves from due-soon to overdue and retains historical overdue after a new independent referral', () => {
    const sources = sourceDriftFixture('yw');
    let ledger = beginQl234DriftAudit(sources, {}, 'yw', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl234Drift(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED',
      category === 'actual_repair' ? 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT' : 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Fictional held source continuity reviewed locally');
    for (let i = 0; i < 2; i++) ledger = advanceQl234Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql234CompanyContinuity(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    expect(prepareQl234HeldRecheck(sources, ledger, 'yw', 'inbox')).toBe(ledger);
    ledger = advanceQl234Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql234CompanyContinuity(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl234Drift(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED', 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Overdue source needs independent referral')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl234Drift(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED',
      'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT', 'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED',
      'Fictional overdue source recheck referral remains unsent');
    expect(ql234CompanyContinuity(sources, ledger, 'yw')).toMatchObject({
      overdue: 0, overdueFollowUpEpisodes: 2, missingFollowUps: 0 });
    for (const check of QL234_CHECKS) ledger = acknowledgeQl234Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl234HeldRecheck(sources, ledger, 'yw', 'inbox');
    expect(ql234Portfolio(sources, ledger)).toMatchObject({ prepared: 1, externalWrites: 0 });
  });

  it('blocks conditional release exceptions even when imaginary source identity matches', () => {
    const sources = sourceDriftFixture('icamp');
    let ledger = beginQl234DriftAudit(sources, {}, 'icamp', 'inbox');
    ledger = recordQl234Drift(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED', 'Imaginary source matched but held release proof differed');
    ledger = recordQl234Drift(sources, ledger, 'icamp', 'inbox', 'accessibility',
      'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED', 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Fictional accessibility hold remained intact');
    for (const check of QL234_CHECKS) ledger = acknowledgeQl234Check(sources, ledger, 'icamp', 'inbox', check.id);
    expect(ql234CompanyContinuity(sources, ledger, 'icamp')).toMatchObject({ holdExceptions: 1, prepared: 0 });
    expect(prepareQl234HeldRecheck(sources, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('freezes source revisions, proof tampering and upstream withdrawal without affecting another company', () => {
    const a = sourceDriftFixture('rosiedazzlers');
    const b = sourceDriftFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql234Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql234Sources;
    let ledger = beginQl234DriftAudit(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl234DriftAudit(sources, ledger, 'icamp', 'inbox');
    const other = ledger.rosiedazzlers?.inbox;
    const revised: Ql234Sources = { ...sources, followUpIntegrity: { ...sources.followUpIntegrity, icamp: {
      ...sources.followUpIntegrity.icamp, inbox: { ...sources.followUpIntegrity.icamp?.inbox!, gaps: {
        ...sources.followUpIntegrity.icamp?.inbox?.gaps, actual_repair: {
          ...sources.followUpIntegrity.icamp?.inbox?.gaps.actual_repair!, note: 'Imaginary source identity revised during reassessment' } } } } } };
    expect(ql234CompanyContinuity(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL233_SOURCE_IDENTITY_REVISED');
    expect(recordQl234Drift(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Frozen source cannot accept review')).toBe(ledger);
    ledger = beginQl234DriftAudit(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(other);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql234CompanyContinuity(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const tampered: Ql234Ledger = { ...ledger, icamp: { ...ledger.icamp, inbox: {
      ...ledger.icamp?.inbox!, holdToken: 'modified-held-proof-local-token' } } };
    expect(ql234CompanyContinuity(revised, tampered, 'icamp').cases[0].sourceStatus).toBe('ACTUAL_RELEASE_HOLD_REVISED');
    expect(prepareQl234HeldRecheck(revised, tampered, 'icamp', 'inbox')).toBe(tampered);
    const withdrawn: Ql234Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql234CompanyContinuity(withdrawn, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl234DriftAudit(withdrawn, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports blocked, status-only receipts without local notes, fingerprints or reviewer identities', () => {
    const sources = sourceDriftFixture('icamp');
    let ledger = beginQl234DriftAudit(sources, {}, 'icamp', 'inbox');
    ledger = recordQl234Drift(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT',
      'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Secret imaginary reviewer details remain session only');
    const receipt = ql234CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"holdTokensIncluded": false');
    expect(receipt).not.toContain('Secret imaginary reviewer details');
    expect(receipt).not.toContain('fictional-drift-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

describe('QL-234 source drift continuity operator UI', () => {
  it('shows navigation, four-company held matrix, help, QL-233 source and sanitized receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Source drift & release continuity', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql234-release="${QL234_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Source drift & continuity help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-234 held-release receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-234 held-release receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql234-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  }, 15_000);

  it('prepares a local held-release packet only after drift closure, independent continuity and checks', async () => {
    const sources = sourceDriftFixture('rosiedazzlers');
    function Harness() {
      const [ledger, setLedger] = useState<Ql234Ledger>({});
      return <Ql234SourceDriftContinuityAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional source drift & held-release recheck');
    await select('#ql234-drift', 'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED');
    await select('#ql234-continuity', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT');
    await select('#ql234-hold', 'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED');
    await type('#ql234-note', 'Imaginary independent held-source follow-up remains unsent');
    await click('Record fictional source & continuity recheck · UNSENT');
    await select('#ql234-gap', 'accessibility');
    await select('#ql234-continuity', 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT');
    await type('#ql234-note', 'Imaginary accessibility source remains held');
    await click('Record fictional source & continuity recheck · UNSENT');
    for (const check of QL234_CHECKS) await click('Acknowledge conditional hold · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare source drift & held-release packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare source drift & held-release packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-234 held-release receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-234 held-release receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Imaginary independent held-source follow-up remains unsent');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function renewalWatchFixture(company: OrganizationId): Ql235Sources {
  const sources = sourceDriftFixture(company);
  let sourceDrift = beginQl234DriftAudit(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) sourceDrift = recordQl234Drift(
    sources, sourceDrift, company, 'inbox', category, 'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT' : 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT',
    'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'Fictional prepared QL-234 evidence never independently verified');
  for (const check of QL234_CHECKS) sourceDrift = acknowledgeQl234Check(sources, sourceDrift, company, 'inbox', check.id);
  sourceDrift = prepareQl234HeldRecheck(sources, sourceDrift, company, 'inbox');
  expect(sourceDrift[company]?.inbox?.phase).toBe('held_conditional_release_integrity_packet_prepared');
  return { ...sources, sourceDrift };
}

describe('QL-235 reopened drift aging, independent renewal and conditional hold watch', () => {
  it('shows four disabled-preview companies and blocks any review without prepared QL-234', () => {
    const fixture = renewalWatchFixture('icamp');
    const sources: Ql235Sources = { ...fixture, sourceDrift: {} };
    const portfolio = ql235Portfolio(sources, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL235_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReview: false,
      actualOwnerAuthorization: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl235Renewal(sources, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('blocks reopened drift and pending hold proof; closes only with independent renewal and fresh checks', () => {
    const sources = renewalWatchFixture('devilndove');
    let ledger = beginQl235Renewal(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('independent_renewal_watch_draft');
    expect(recordQl235Renewal(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED', 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Incorrect unsupported watch')).toBe(ledger);
    expect(recordQl235Renewal(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_INDEPENDENT_RENEWAL_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Invalid enum rejected')).toBe(ledger);
    for (const note of ['Initial imaginary reopened drift', 'Edited imaginary drift in same cycle']) ledger = recordQl235Renewal(
      sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED', 'REOPEN_INDEPENDENT_EXCEPTION_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', note);
    ledger = recordQl235Renewal(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_RENEWAL_MATCH_UNVERIFIED', 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Imaginary accessibility evidence held');
    for (const check of QL235_CHECKS) ledger = acknowledgeQl235Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql235CompanyWatch(sources, ledger, 'devilndove')).toMatchObject({ reopened: 1, reopenEvents: 1, prepared: 0 });
    expect(prepareQl235HeldAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl235Renewal(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RENEWAL_MATCH_UNVERIFIED', 'REFER_INDEPENDENT_RENEWAL_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Imaginary reopened source locally rechecked');
    expect(ql235CompanyWatch(sources, ledger, 'devilndove').cases[0].checksComplete).toBe(false);
    for (const check of QL235_CHECKS) ledger = acknowledgeQl235Check(sources, ledger, 'devilndove', 'inbox', check.id);
    ledger = prepareQl235HeldAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql235CompanyWatch(sources, ledger, 'devilndove')).toMatchObject({
      reopened: 0, reopenEvents: 1, prepared: 1, holdAudit: { held: 12, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl235Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
  });

  it('ages due-soon then overdue, requires a new independent referral and preserves late history', () => {
    const sources = renewalWatchFixture('yw');
    let ledger = beginQl235Renewal(sources, {}, 'yw', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl235Renewal(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_RENEWAL_MATCH_UNVERIFIED',
      category === 'actual_repair' ? 'REFER_INDEPENDENT_RENEWAL_DRAFT' : 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Fictional initial renewal retained held release');
    for (let i = 0; i < 2; i++) ledger = advanceQl235Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql235CompanyWatch(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    ledger = advanceQl235Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql235CompanyWatch(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl235Renewal(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_RENEWAL_MATCH_UNVERIFIED', 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Overdue referral cannot be skipped')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl235Renewal(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_RENEWAL_MATCH_UNVERIFIED',
      'REFER_INDEPENDENT_RENEWAL_DRAFT', 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED',
      'Fictional overdue independent renewal draft is unsent');
    expect(ql235CompanyWatch(sources, ledger, 'yw')).toMatchObject({ overdue: 0, overdueEpisodes: 2 });
    for (const check of QL235_CHECKS) ledger = acknowledgeQl235Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl235HeldAudit(sources, ledger, 'yw', 'inbox');
    expect(ql235Portfolio(sources, ledger)).toMatchObject({ prepared: 1, livePilotReady: false, externalWrites: 0 });
  });

  it('freezes upstream revisions and separates company reset from other companies', () => {
    const a = renewalWatchFixture('rosiedazzlers');
    const b = renewalWatchFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql235Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql235Sources;
    let ledger = beginQl235Renewal(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl235Renewal(sources, ledger, 'icamp', 'inbox');
    const unaffected = ledger.rosiedazzlers?.inbox;
    const revised: Ql235Sources = { ...sources, sourceDrift: { ...sources.sourceDrift, icamp: {
      ...sources.sourceDrift.icamp, inbox: { ...sources.sourceDrift.icamp?.inbox!, gaps: {
        ...sources.sourceDrift.icamp?.inbox?.gaps, actual_repair: {
          ...sources.sourceDrift.icamp?.inbox?.gaps.actual_repair!, note: 'Source proof changed after QL-235 review began' } } } } } };
    expect(ql235CompanyWatch(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL234_EVIDENCE_REVISED');
    expect(recordQl235Renewal(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RENEWAL_MATCH_UNVERIFIED', 'REFER_INDEPENDENT_RENEWAL_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Frozen source must remain unchanged')).toBe(ledger);
    ledger = beginQl235Renewal(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(unaffected);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    const tampered: Ql235Ledger = { ...ledger, icamp: { ...ledger.icamp, inbox: {
      ...ledger.icamp?.inbox!, holdToken: 'forged-hold' } } };
    expect(ql235CompanyWatch(revised, tampered, 'icamp').cases[0].sourceStatus).toBe('ACTUAL_HOLD_REVISED');
    expect(prepareQl235HeldAudit(revised, tampered, 'icamp', 'inbox')).toBe(tampered);
    const stale: Ql235Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql235CompanyWatch(stale, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl235Renewal(stale, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports only fictional status and hold states, never notes, tokens or identities', () => {
    const sources = renewalWatchFixture('icamp');
    let ledger = beginQl235Renewal(sources, {}, 'icamp', 'inbox');
    ledger = recordQl235Renewal(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED', 'REOPEN_INDEPENDENT_EXCEPTION_DRAFT',
      'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'PRIVATE fictional reviewer identity must not be exported');
    const receipt = ql235CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"sourceTokensIncluded": false');
    expect(receipt).not.toContain('PRIVATE fictional reviewer');
    expect(receipt).not.toContain('fictional-renewal-');
    expect(receipt).not.toContain('forged-hold');
  });
});

describe('QL-235 operator renewal watch UI', () => {
  it('navigates to QL-235 with help, matrix, QL-234 source link and status-only receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Independent renewal & hold watch', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql235-release="${QL235_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Renewal watch help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-235 renewal receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-235 renewal receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql235-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  }, 15_000);

  it('prepares a local audit only after renewed gaps, independent referral and acknowledgement', async () => {
    const sources = renewalWatchFixture('rosiedazzlers');
    function Harness() {
      const [ledger, setLedger] = useState<Ql235Ledger>({});
      return <Ql235RenewalWatchAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional renewal watch & held recheck');
    await select('#ql235-renewal', 'SIMULATED_RENEWAL_MATCH_UNVERIFIED');
    await select('#ql235-referral', 'REFER_INDEPENDENT_RENEWAL_DRAFT');
    await select('#ql235-hold', 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED');
    await type('#ql235-note', 'Imaginary independent renewal remains unsent');
    await click('Record fictional renewal & held proof · UNSENT');
    await select('#ql235-gap', 'accessibility');
    await select('#ql235-referral', 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT');
    await type('#ql235-note', 'Imaginary accessibility renewed under hold');
    await click('Record fictional renewal & held proof · UNSENT');
    for (const check of QL235_CHECKS) await click('Acknowledge renewal check · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare independent renewal & held audit'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare independent renewal & held audit');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-235 renewal receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-235 renewal receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Imaginary independent renewal remains unsent');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});

function receiptHandoffFixture(company: OrganizationId): Ql236Sources {
  const sources = renewalWatchFixture(company);
  let renewalWatch = beginQl235Renewal(sources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) renewalWatch = recordQl235Renewal(
    sources, renewalWatch, company, 'inbox', category, 'SIMULATED_RENEWAL_MATCH_UNVERIFIED',
    category === 'actual_repair' ? 'REFER_INDEPENDENT_RENEWAL_DRAFT' : 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT',
    'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'Synthetic QL-235 renewal is not independently verified');
  for (const check of QL235_CHECKS) renewalWatch = acknowledgeQl235Check(sources, renewalWatch, company, 'inbox', check.id);
  renewalWatch = prepareQl235HeldAudit(sources, renewalWatch, company, 'inbox');
  expect(renewalWatch[company]?.inbox?.phase).toBe('held_renewal_audit_packet_prepared');
  return { ...sources, renewalWatch };
}

describe('QL-236 independent handoff receipt aging and held-release continuity', () => {
  it('starts held across all four companies without any independent real receipt, writes or provider activity', () => {
    const fixture = receiptHandoffFixture('icamp');
    const noPreparedSource: Ql236Sources = { ...fixture, renewalWatch: {} };
    const portfolio = ql236Portfolio(noPreparedSource, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL236_RELEASE, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReceipt: false,
      actualOwnerAuthorization: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl236Receipt(noPreparedSource, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('counts a fictional receipt exception once per gap per cycle, blocks packet until resolved and rechecks acknowledgements', () => {
    const sources = receiptHandoffFixture('devilndove');
    let ledger = beginQl236Receipt(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('independent_receipt_handoff_draft');
    expect(recordQl236Receipt(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED', 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Missing independent follow-up')).toBe(ledger);
    expect(recordQl236Receipt(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Invalid status is blocked')).toBe(ledger);
    for (const note of ['First fictional receipt exception', 'Repeat fictional edit in same cycle']) ledger = recordQl236Receipt(
      sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED', 'REOPEN_INDEPENDENT_RECEIPT_EXCEPTION_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', note);
    ledger = recordQl236Receipt(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Fictional accessibility handoff remains held');
    for (const check of QL236_CHECKS) ledger = acknowledgeQl236Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql236CompanyReceipts(sources, ledger, 'devilndove')).toMatchObject({ openExceptions: 1, exceptionEvents: 1, prepared: 0 });
    expect(prepareQl236HeldReceipt(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl236Receipt(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Fictional independent receipt reviewed locally');
    expect(ql236CompanyReceipts(sources, ledger, 'devilndove').cases[0].checksComplete).toBe(false);
    for (const check of QL236_CHECKS) ledger = acknowledgeQl236Check(sources, ledger, 'devilndove', 'inbox', check.id);
    ledger = prepareQl236HeldReceipt(sources, ledger, 'devilndove', 'inbox');
    expect(ql236CompanyReceipts(sources, ledger, 'devilndove')).toMatchObject({
      prepared: 1, openExceptions: 0, exceptionEvents: 1,
      holdAudit: { held: 12, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl236Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
  });

  it('moves due-soon to overdue, requires a fresh independent receipt and retains late history', () => {
    const sources = receiptHandoffFixture('yw');
    let ledger = beginQl236Receipt(sources, {}, 'yw', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl236Receipt(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED',
      category === 'actual_repair' ? 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT' : 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Imaginary original handoff receipt remains held');
    for (let i = 0; i < 2; i++) ledger = advanceQl236Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql236CompanyReceipts(sources, ledger, 'yw')).toMatchObject({ dueSoon: 2, overdue: 0 });
    expect(prepareQl236HeldReceipt(sources, ledger, 'yw', 'inbox')).toBe(ledger);
    ledger = advanceQl236Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql236CompanyReceipts(sources, ledger, 'yw')).toMatchObject({ dueSoon: 0, overdue: 2 });
    expect(recordQl236Receipt(sources, ledger, 'yw', 'inbox', 'accessibility',
      'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Overdue independent referral is mandatory')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl236Receipt(
      sources, ledger, 'yw', 'inbox', category, 'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED',
      'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT', 'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED',
      'Fictional refreshed independent receipt remains unsent');
    expect(ql236CompanyReceipts(sources, ledger, 'yw')).toMatchObject({ overdue: 0, overdueEpisodes: 2 });
    for (const check of QL236_CHECKS) ledger = acknowledgeQl236Check(sources, ledger, 'yw', 'inbox', check.id);
    ledger = prepareQl236HeldReceipt(sources, ledger, 'yw', 'inbox');
    expect(ql236Portfolio(sources, ledger)).toMatchObject({ prepared: 1, livePilotReady: false, externalWrites: 0 });
  });

  it('cannot conceal fictional conditional hold exceptions with matching receipts', () => {
    const sources = receiptHandoffFixture('icamp');
    let ledger = beginQl236Receipt(sources, {}, 'icamp', 'inbox');
    ledger = recordQl236Receipt(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT',
      'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED', 'Fictional held proof exception cannot be hidden');
    ledger = recordQl236Receipt(sources, ledger, 'icamp', 'inbox', 'accessibility',
      'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Imaginary accessibility receipt matched');
    for (const check of QL236_CHECKS) ledger = acknowledgeQl236Check(sources, ledger, 'icamp', 'inbox', check.id);
    expect(ql236CompanyReceipts(sources, ledger, 'icamp')).toMatchObject({ holdExceptions: 1, prepared: 0 });
    expect(prepareQl236HeldReceipt(sources, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('freezes upstream source revision, isolates another company and rejects tampered holds', () => {
    const a = receiptHandoffFixture('rosiedazzlers');
    const b = receiptHandoffFixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql236Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql236Sources;
    let ledger = beginQl236Receipt(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl236Receipt(sources, ledger, 'icamp', 'inbox');
    const unaffected = ledger.rosiedazzlers?.inbox;
    const revised: Ql236Sources = { ...sources, renewalWatch: { ...sources.renewalWatch, icamp: {
      ...sources.renewalWatch.icamp, inbox: { ...sources.renewalWatch.icamp?.inbox!, gaps: {
        ...sources.renewalWatch.icamp?.inbox?.gaps, actual_repair: {
          ...sources.renewalWatch.icamp?.inbox?.gaps.actual_repair!, note: 'Source renewal receipt changed after handoff' } } } } } };
    expect(ql236CompanyReceipts(revised, ledger, 'icamp').cases[0].sourceStatus).toBe('QL235_RECEIPT_SOURCE_REVISED');
    expect(recordQl236Receipt(revised, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'Cannot mutate a frozen source')).toBe(ledger);
    ledger = beginQl236Receipt(revised, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(unaffected);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    const tampered: Ql236Ledger = { ...ledger, icamp: { ...ledger.icamp, inbox: {
      ...ledger.icamp?.inbox!, holdToken: 'fabricated-release-proof' } } };
    expect(ql236CompanyReceipts(revised, tampered, 'icamp').cases[0].sourceStatus).toBe('ACTUAL_HOLD_REVISED');
    expect(prepareQl236HeldReceipt(revised, tampered, 'icamp', 'inbox')).toBe(tampered);
    const withdrawn: Ql236Sources = { ...revised, trial: { ...revised.trial, icamp: {} } };
    expect(ql236CompanyReceipts(withdrawn, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl236Receipt(withdrawn, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('redacts synthetic notes, identities and change tokens from receipt', () => {
    const sources = receiptHandoffFixture('icamp');
    let ledger = beginQl236Receipt(sources, {}, 'icamp', 'inbox');
    ledger = recordQl236Receipt(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED', 'REOPEN_INDEPENDENT_RECEIPT_EXCEPTION_DRAFT',
      'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'PRIVATE synthetic reviewer detail must stay in session');
    const receipt = ql236CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"sourceTokensIncluded": false');
    expect(receipt).not.toContain('PRIVATE synthetic reviewer');
    expect(receipt).not.toContain('fictional-receipt-');
    expect(receipt).not.toContain('fabricated-release-proof');
  });
});

describe('QL-236 operator independent receipt UI', () => {
  it('navigates between four companies, contextual help, QL-235 source and redacted receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Receipt handoff & overdue continuity', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql236-release="${QL236_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Receipt handoff help');
    expect(host.textContent).toContain('case-only reset');
    await click('Show local QL-236 handoff receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-236 handoff receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql236-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  }, 15_000);

  it('prepares only after independent fictional receipts, separate referral and fresh checks', async () => {
    const sources = receiptHandoffFixture('rosiedazzlers');
    function Harness() {
      const [ledger, setLedger] = useState<Ql236Ledger>({});
      return <Ql236ReceiptHandoffAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional receipt handoff & hold watch');
    await select('#ql236-receipt', 'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED');
    await select('#ql236-handoff', 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT');
    await select('#ql236-hold', 'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED');
    await type('#ql236-note', 'Imaginary independent handoff receipt remains unsent');
    await click('Record fictional independent receipt · UNSENT');
    await select('#ql236-gap', 'accessibility');
    await select('#ql236-handoff', 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT');
    await type('#ql236-note', 'Imaginary accessibility receipt is held locally');
    await click('Record fictional independent receipt · UNSENT');
    for (const check of QL236_CHECKS) await click('Acknowledge receipt check · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare conditional held receipt packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare conditional held receipt packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-236 handoff receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-236 handoff receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Imaginary independent handoff receipt remains unsent');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});
