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
import { beginQl215Tracking, advanceQl215Cycle, noteQl215FollowUp, type Ql215Ledger } from '../ql215FollowUpAudit';
import { QL216_RELEASE, beginQl216Replay, draftQl216Handoff, prepareQl216Handoff, ql216CompanyReplay,
  ql216CompanyReceipt, ql216Portfolio, type Ql216Ledger } from '../ql216EscalationHandoff';

type Company = 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw';
function fixture(company: Company) {
  const trial = recordQl211Observation({} as Ql211Ledger, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'fictional inbox issue' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Fictional updated conversation layout');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {} as Ql213Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review, company, 'inbox',
    check.id, 'drafted_unverified', `Fictional independent checklist ${check.id}`);
  let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox', 'fictional_security_reviewer',
    'Fictional handoff awaiting real external reviewer evidence');
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', { category: 'actual_repair',
    priority: 'P0', followUp: 'FOLLOWUP_PLANNED', note: 'Fictional repair proof still not independently verified' });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, company, 'inbox');
  for (let index = 0; index < 3; index++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  return { trial, repair, review, intake, audit };
}

describe('QL-216 source-linked local escalation replay and hold model', () => {
  it('shows empty four-company portfolio and never unblocks twelve live-pilot prerequisites', () => {
    const model = ql216Portfolio({}, {}, {}, {}, {}, {});
    expect(model.release).toBe(QL216_RELEASE);
    expect(model.companies).toHaveLength(4);
    expect(model).toMatchObject({ eligible: 0, prepared: 0, stale: 0, allHoldsPreserved: true,
      livePilotReady: false, ownerApprovalCaptured: false, independentApproval: false,
      callsPlaced: 0, messagesSent: 0, externalWrites: 0 });
    expect(model.prerequisites).toHaveLength(12);
    expect(model.prerequisites.every((hold) => hold.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(beginQl216Replay({}, {}, {}, {}, {}, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires actual upstream local preparation, escalated aging, explicit packet drafting and preparation', () => {
    const { trial, repair, review, intake, audit } = fixture('rosiedazzlers');
    const empty = {} as Ql216Ledger;
    expect(beginQl216Replay(trial, repair, review, intake, {}, empty, 'rosiedazzlers', 'inbox')).toBe(empty);
    let packets = beginQl216Replay(trial, repair, review, intake, audit, empty, 'rosiedazzlers', 'inbox');
    expect(ql216CompanyReplay(trial, repair, review, intake, audit, packets, 'rosiedazzlers')).toMatchObject({
      eligible: 1, reviewDue: 1, prepared: 0, stale: 0 });
    expect(draftQl216Handoff(trial, repair, review, intake, audit, packets, 'rosiedazzlers', 'inbox',
      'OWNER_ESCALATION_DRAFT', 'tiny')).toBe(packets);
    expect(prepareQl216Handoff(trial, repair, review, intake, audit, packets, 'rosiedazzlers', 'inbox')).toBe(packets);
    packets = draftQl216Handoff(trial, repair, review, intake, audit, packets, 'rosiedazzlers', 'inbox',
      'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Fictional owner packet prepared without actual dispatch');
    packets = prepareQl216Handoff(trial, repair, review, intake, audit, packets, 'rosiedazzlers', 'inbox');
    expect(packets.rosiedazzlers?.inbox?.phase).toBe('local_handoff_prepared');
    expect(ql216CompanyReplay(trial, repair, review, intake, audit, packets, 'rosiedazzlers')).toMatchObject({
      prepared: 1, stale: 0, holdsIntact: true, independentReviewCompleted: false, actualOwnerApproved: false });
    const receipt = ql216CompanyReceipt(trial, repair, review, intake, audit, packets, 'rosiedazzlers');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Fictional owner packet prepared without actual dispatch');
    expect(receipt).not.toContain(packets.rosiedazzlers!.inbox!.auditToken);
    expect(receipt).not.toContain('fictional inbox issue');
  });

  it('freezes source changes and withdrawn scenarios, retaining release holds', () => {
    const { trial, repair, review, intake, audit } = fixture('yw');
    const packets = beginQl216Replay(trial, repair, review, intake, audit, {}, 'yw', 'inbox');
    const changed = advanceQl215Cycle(trial, repair, review, intake, audit, 'yw', 'inbox');
    expect(ql216CompanyReplay(trial, repair, review, intake, changed, packets, 'yw').cases[0].sourceStatus).toBe('AUDIT_REVISED');
    expect(prepareQl216Handoff(trial, repair, review, intake, changed, packets, 'yw', 'inbox')).toBe(packets);
    const upstream = recordQl211Observation(trial, 'yw', 'inbox', { note: 'new source observation' });
    expect(ql216CompanyReplay(upstream, repair, review, intake, audit, packets, 'yw').cases[0].sourceStatus).toBe('UPSTREAM_STALE');
    expect(beginQl216Replay(upstream, repair, review, intake, audit, packets, 'yw', 'inbox')).toBe(packets);
    const withdrawn = recordQl211Observation(trial, 'yw', 'inbox', { outcome: 'not_run' });
    expect(ql216CompanyReplay(withdrawn, repair, review, intake, audit, packets, 'yw')).toMatchObject({ orphaned: 1, stale: 1 });
    expect(ql216CompanyReplay(trial, repair, review, intake, changed, packets, 'yw').holdsIntact).toBe(true);
  });

  it('retains a drafted escalation for a local handoff even when follow-up resets a simulated age band', () => {
    const { trial, repair, review, intake, audit } = fixture('devilndove');
    const reset = noteQl215FollowUp(trial, repair, review, intake, audit, 'devilndove', 'inbox',
      'actual_repair', 'ESCALATION_DRAFTED', 'Invented local review escalation, not actually transmitted');
    expect(ql216CompanyReplay(trial, repair, review, intake, reset, {}, 'devilndove')).toMatchObject({ reviewDue: 0, escalationDrafts: 1, eligible: 1 });
    const packets = beginQl216Replay(trial, repair, review, intake, reset, {}, 'devilndove', 'inbox');
    expect(packets.devilndove?.inbox?.phase).toBe('review_draft');
    expect(ql216CompanyReplay(trial, repair, review, intake, reset, packets, 'rosiedazzlers').cases).toEqual([]);
    expect(ql216CompanyReplay(trial, repair, review, intake, reset, packets, 'icamp').cases).toEqual([]);
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />)); });
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

describe('QL-216 integrated operator handoff audit', () => {
  it('starts empty, navigates to QL-215, and shows the policy holds and safe receipt', async () => {
    await click('Escalation replay & owner-safe handoff', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql216-release="${QL216_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('No QL-211 observed finding');
    expect(host.textContent).toContain('12 HELD');
    await click('ⓘ Replay help');
    expect(host.textContent).toContain('invalidates the old packet');
    await click('Show fixed-schema local audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only escalation handoff audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('Open owner trial', '.ql216-panel button');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('rehearses QL-211 through QL-216 locally and keeps a current packet confined to its company', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'Fictional inbox issue for escalation replay');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Fictional layout fix for independent source comparison');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    for (const check of QL213_REVIEW_CHECKS) {
      await type(`#ql213-note-${check.id}`, `Fictional reviewer checklist ${check.id}`);
      const button = host.querySelector<HTMLTextAreaElement>(`#ql213-note-${check.id}`)!
        .closest('.ql213-check')!.querySelector<HTMLButtonElement>('button')!;
      await act(async () => button.click());
    }
    await click('Open QL-214 review intake & holds');
    await click('Begin fictional independent-review intake');
    await select('#ql214-reviewer', 'fictional_security_reviewer');
    await type('#ql214-brief', 'Fictional escalation packet requires source reconciliation');
    await select('#ql214-gap-followup', 'FOLLOWUP_PLANNED');
    await type('#ql214-gap-note', 'Fictional source repair needs independent verification');
    await click('Save gap or update category');
    await click('Prepare local handoff · NO DISPATCH');
    await click('Open QL-215 follow-up aging & hold audit');
    await click('Start simulated follow-up tracking');
    for (let i = 0; i < 3; i++) await click('Advance simulated review cycle (+1)');
    await click('Escalation replay & owner-safe handoff', '.ql172-nav-button');
    expect(host.textContent).toContain('Begin fictional escalation replay');
    await click('Begin fictional escalation replay');
    await select('#ql216-disposition', 'INDEPENDENT_REVIEW_PACKET_DRAFT');
    await type('#ql216-note', 'A fake owner-only escalation packet, never transmitted');
    await click('Save fictional disposition · NO DISPATCH');
    await click('Prepare local handoff packet · NO DISPATCH');
    expect(host.textContent).toContain('Locally prepared packet available');
    await click('Show fixed-schema local audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only escalation handoff audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).not.toContain('A fake owner-only escalation packet');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).toContain('No QL-211 observed finding');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Locally prepared packet available');
  });
});
