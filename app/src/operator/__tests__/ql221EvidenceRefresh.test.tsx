// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql221EvidenceRefresh } from '../Ql221EvidenceRefresh';
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
import { QL221_RELEASE, QL221_CHECKS, beginQl221Refresh, recordQl221Refresh, advanceQl221Cycle,
  acknowledgeQl221Check, prepareQl221ContinuityAudit, ql221CompanyReassessment, ql221CompanyReceipt,
  ql221Portfolio, type Ql221Sources, type Ql221Ledger } from '../ql221EvidenceRefresh';

/** End-to-end synthetic source chain; no real database, attachment, review or provider is used. */
function fixture(company: OrganizationId, recurring = false): Ql221Sources {
  const trial = recordQl211Observation({}, company, 'inbox', { outcome: 'observed_gap', severity: 'high',
    area: 'workflow', note: 'Fictional workflow observation needs later independent evidence' });
  let repair = queueQl212Finding(trial, {}, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Synthetic repair evidence still unverified');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {}, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review,
    company, 'inbox', check.id, 'drafted_unverified', `Invented ${check.id} check is unverified`);
  let intake = beginQl214Intake(trial, repair, review, {}, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox',
    'fictional_security_reviewer', 'Fictional intake request never submitted');
  for (const category of ['actual_repair', 'accessibility'] as const) intake = upsertQl214Gap(trial, repair,
    review, intake, company, 'inbox', { category, priority: category === 'actual_repair' ? 'P0' : 'P3',
      followUp: 'FOLLOWUP_PLANNED', note: `Synthetic ${category} gap remains unresolved` });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {}, company, 'inbox');
  for (let i = 0; i < 3; i++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  let handoff = beginQl216Replay(trial, repair, review, intake, audit, {}, company, 'inbox');
  handoff = draftQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox',
    'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Synthetic handoff not transmitted to any reviewer');
  handoff = prepareQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox');
  let reassessment = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reassessment = noteQl217EvidenceReassessment(
    trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox', category,
    'INDEPENDENT_RETEST_PLANNED', `Fictional ${category} reassessment not verified`);
  reassessment = prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox');
  const first = { trial, repair, review, intake, audit, handoff, reassessment };
  let recurrence = beginQl218Replay(first, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) recurrence = recordQl218Replay(first,
    recurrence, company, 'inbox', category, 'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT',
    `Fictional ${category} remains held`);
  if (recurring) {
    recurrence = advanceQl218Cycle(first, recurrence, company, 'inbox');
    recurrence = recordQl218Replay(first, recurrence, company, 'inbox', 'actual_repair',
      'INDEPENDENT_EXCEPTION_REVIEW_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT',
      'Repeated synthetic repair evidence still open');
  }
  recurrence = prepareQl218HoldAudit(first, recurrence, company, 'inbox');
  const previous = { ...first, recurrence };
  let closure: Ql219Ledger = beginQl219Reconciliation(previous, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) closure = recordQl219Outcome(previous,
    closure, company, 'inbox', category, 'OPEN_EXCEPTION_RECONFIRMED',
    recurring && category === 'actual_repair' ? 'INDEPENDENT_REVIEW_REQUIRED_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Fictional QL-219 ${category} review unverified`);
  for (const check of QL219_REVIEW_CHECKS) closure = acknowledgeQl219Check(previous, closure, company, 'inbox', check.id);
  closure = prepareQl219Review(previous, closure, company, 'inbox');
  const beforeReopen = { ...previous, closure };
  let reopen: Ql220Ledger = beginQl220Reopen(beforeReopen, {}, company, 'inbox', 'Fictional reopen reason is still outstanding');
  for (const category of ['actual_repair', 'accessibility'] as const) reopen = recordQl220Exception(beforeReopen,
    reopen, company, 'inbox', category, 'MONITOR_OPEN_HOLD_DRAFT',
    recurring && category === 'actual_repair' ? 'INDEPENDENT_REVIEW_ESCALATION_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Invented QL-220 monitoring note for ${category}`);
  for (const check of QL220_CHECKS) reopen = acknowledgeQl220Check(beforeReopen, reopen, company, 'inbox', check.id);
  reopen = prepareQl220FollowUpAudit(beforeReopen, reopen, company, 'inbox');
  return { ...beforeReopen, reopen };
}

describe('QL-221 evidence-refresh and hold-continuity model', () => {
  it('begins empty for all four companies with 12 immutable QL-181 holds and no actual authority', () => {
    const empty: Ql221Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {}, handoff: {},
      reassessment: {}, recurrence: {}, closure: {}, reopen: {} };
    const portfolio = ql221Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL221_RELEASE, eligible: 0, tracking: 0, prepared: 0,
      allReleaseHoldsPreserved: true, realEvidenceVerified: false, actualIndependentClosure: false,
      actualOwnerApproval: false, providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl221Refresh(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl221ContinuityAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires prepared QL-220, all gap refreshes, recurring escalation and three local checks', () => {
    const sources = fixture('devilndove', true);
    expect(sources.reopen.devilndove?.inbox?.phase).toBe('owner_followup_audit_prepared');
    let ledger = beginQl221Refresh(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('evidence_refresh_draft');
    expect(recordQl221Refresh(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'EVIDENCE_GAP_STILL_OPEN', 'QL220_LOCAL_REPLAY', 'MAINTAIN_HOLD_DRAFT', 'short')).toBe(ledger);
    expect(recordQl221Refresh(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'EVIDENCE_GAP_STILL_OPEN', 'unknown' as never, 'MAINTAIN_HOLD_DRAFT', 'Fictional invalid source')).toBe(ledger);
    ledger = recordQl221Refresh(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'EVIDENCE_GAP_STILL_OPEN', 'QL220_LOCAL_REPLAY', 'MAINTAIN_HOLD_DRAFT', 'Synthetic evidence gap still open');
    expect(prepareQl221ContinuityAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl221Refresh(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'SOURCE_UNCHANGED_UNVERIFIED', 'SIMULATED_RETEST_RECORD', 'MAINTAIN_HOLD_DRAFT',
      'Invented accessibility evidence remains unverified');
    for (const check of QL221_CHECKS) ledger = acknowledgeQl221Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql221CompanyReassessment(sources, ledger, 'devilndove').escalationDue).toBe(1);
    expect(prepareQl221ContinuityAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl221Refresh(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'FICTIONAL_NEW_EVIDENCE_PENDING_REVIEW', 'FICTIONAL_OWNER_ATTACHMENT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT',
      'Fictional new attachment not actually uploaded or reviewed');
    ledger = prepareQl221ContinuityAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql221CompanyReassessment(sources, ledger, 'devilndove')).toMatchObject({ prepared: 1,
      holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl221Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl221Refresh(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'EVIDENCE_GAP_STILL_OPEN', 'QL220_LOCAL_REPLAY', 'MAINTAIN_HOLD_DRAFT', 'Cannot change prepared packet')).toBe(ledger);
  });

  it('ages each invented evidence refresh independently and blocks overdue packet preparation', () => {
    const sources = fixture('yw');
    let ledger = beginQl221Refresh(sources, {}, 'yw', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl221Refresh(sources,
      ledger, 'yw', 'inbox', category, 'SOURCE_UNCHANGED_UNVERIFIED', 'QL220_LOCAL_REPLAY',
      'MAINTAIN_HOLD_DRAFT', `Invented ${category} remains open`);
    for (let cycle = 0; cycle < 3; cycle++) ledger = advanceQl221Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql221CompanyReassessment(sources, ledger, 'yw').overdue).toBe(2);
    for (const check of QL221_CHECKS) ledger = acknowledgeQl221Check(sources, ledger, 'yw', 'inbox', check.id);
    expect(prepareQl221ContinuityAudit(sources, ledger, 'yw', 'inbox')).toBe(ledger);
    ledger = recordQl221Refresh(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'EVIDENCE_GAP_STILL_OPEN', 'SIMULATED_RETEST_RECORD', 'OWNER_RETEST_REQUEST_DRAFT',
      'Synthetic repair follow-up refreshed without a message');
    expect(ql221CompanyReassessment(sources, ledger, 'yw').overdue).toBe(1);
    ledger = recordQl221Refresh(sources, ledger, 'yw', 'inbox', 'accessibility',
      'EVIDENCE_GAP_STILL_OPEN', 'QL220_LOCAL_REPLAY', 'MAINTAIN_HOLD_DRAFT',
      'Synthetic accessibility follow-up refreshed');
    expect(ql221CompanyReassessment(sources, ledger, 'yw').overdue).toBe(0);
    ledger = prepareQl221ContinuityAudit(sources, ledger, 'yw', 'inbox');
    expect(ql221Portfolio(sources, ledger)).toMatchObject({ prepared: 1, messagesSent: 0, callsPlaced: 0 });
  });

  it('freezes revised QL-220 source and withdrawn cases; reset modifies only that case and company', () => {
    const a = fixture('rosiedazzlers');
    const b = fixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql221Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql221Sources;
    let ledger = beginQl221Refresh(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl221Refresh(sources, ledger, 'icamp', 'inbox');
    const rosie = ledger.rosiedazzlers?.inbox;
    const changed: Ql221Sources = { ...sources, reopen: { ...sources.reopen, icamp: {
      ...sources.reopen.icamp, inbox: { ...sources.reopen.icamp?.inbox!,
        gaps: { ...sources.reopen.icamp?.inbox?.gaps, actual_repair: {
          ...sources.reopen.icamp?.inbox?.gaps.actual_repair!, note: 'Changed fictional QL-220 source evidence' } } } } } };
    expect(ql221CompanyReassessment(changed, ledger, 'icamp').cases[0].sourceStatus).toBe('REOPEN_SOURCE_REVISED');
    expect(recordQl221Refresh(changed, ledger, 'icamp', 'inbox', 'actual_repair',
      'EVIDENCE_GAP_STILL_OPEN', 'QL220_LOCAL_REPLAY', 'MAINTAIN_HOLD_DRAFT', 'Frozen record cannot change')).toBe(ledger);
    ledger = beginQl221Refresh(changed, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(rosie);
    expect(ledger.icamp?.inbox?.gapRefreshes).toEqual({});
    expect(ql221CompanyReassessment(changed, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql221Sources = { ...changed, trial: { ...changed.trial, icamp: {} } };
    expect(ql221CompanyReassessment(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl221Refresh(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('keeps private note/fixture contents and source revision markers out of the fixed receipt', () => {
    const sources = fixture('icamp');
    let ledger = beginQl221Refresh(sources, {}, 'icamp', 'inbox');
    ledger = recordQl221Refresh(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'FICTIONAL_NEW_EVIDENCE_PENDING_REVIEW', 'FICTIONAL_OWNER_ATTACHMENT', 'MAINTAIN_HOLD_DRAFT',
      'Private invented fixture note must never export');
    const receipt = ql221CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).toContain('"attachmentsIncluded": false');
    expect(receipt).not.toContain('Private invented');
    expect(receipt).not.toContain('fictional-refresh-');
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

describe('QL-221 operator evidence refresh workspace', () => {
  it('appears in four-company navigation with its redacted receipt and held QL-181 register', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Evidence refresh & hold continuity audit', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql221-release="${QL221_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Evidence refresh help');
    expect(host.textContent).toContain('Three simulated cycles');
    await click('Show local QL-221 continuity receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-221 continuity audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql221-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('reassesses every invented source and prepares only a held-release local packet', async () => {
    const sources = fixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql221Ledger>({});
      return <Ql221EvidenceRefresh organization={operatorOrganizations[0]} sources={sources} ledger={ledger}
        setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional evidence refresh');
    await select('#ql221-action', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT');
    await type('#ql221-note', 'Invented recurring exception remains unverified');
    await click('Save fictional evidence refresh · NO DISPATCH');
    await select('#ql221-gap', 'accessibility');
    await select('#ql221-action', 'MAINTAIN_HOLD_DRAFT');
    await type('#ql221-note', 'Invented accessibility comparison still open');
    await click('Save fictional evidence refresh · NO DISPATCH');
    for (const check of QL221_CHECKS) await click('Acknowledge local hold review · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare evidence refresh & continuity audit'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare evidence refresh & continuity audit');
    expect(host.textContent).toContain('local evidence refresh and hold continuity audit prepared');
    await click('Show local QL-221 continuity receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-221 continuity audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented recurring exception');
  });
});
