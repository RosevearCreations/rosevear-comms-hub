// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';
import { QL213_REVIEW_CHECKS, startQl213Comparison, captureQl213After,
  setQl213Check, type Ql213Ledger } from '../ql213ReviewPreparation';
import { QL214_RELEASE, ql214Portfolio, ql214CompanyReview, ql214CompanyReceipt,
  beginQl214Intake, draftQl214Intake, upsertQl214Gap, prepareQl214Handoff,
  type Ql214Ledger } from '../ql214ReviewIntake';

function prepared(company: 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw') {
  const trial = recordQl211Observation({} as Ql211Ledger, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'fictional inbox focus issue' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Hypothetical focus and responsive card repair plan');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {} as Ql213Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) {
    review = setQl213Check(trial, repair, review, company, 'inbox', check.id,
      'drafted_unverified', `Fictional review packet reference ${check.id}`);
  }
  return { trial, repair, review };
}

describe('QL-214 intake source contract and release holds', () => {
  it('has four empty company portfolios and twelve immutable real-pilot holds', () => {
    const portfolio = ql214Portfolio({}, {}, {}, {});
    expect(portfolio.release).toBe(QL214_RELEASE);
    expect(portfolio.companies).toHaveLength(4);
    expect(portfolio).toMatchObject({ openFindings: 0, drafts: 0, evidenceGaps: 0,
      locallyPrepared: 0, independentlyReviewed: false, ownerApproved: false,
      livePilotReady: false, providerConnected: false, callsPlaced: 0, messagesSent: 0, externalWrites: 0 });
    expect(portfolio.heldPrerequisites).toHaveLength(12);
    expect(portfolio.heldPrerequisites.every((hold) => hold.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(beginQl214Intake({}, {}, {}, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires a completed QL-213 packet and prevents empty or unfollowed evidence gaps from being handed off', () => {
    const { trial, repair, review } = prepared('rosiedazzlers');
    let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, 'rosiedazzlers', 'inbox');
    expect(intake.rosiedazzlers?.inbox).toMatchObject({ phase: 'intake_draft', reviewer: 'unassigned', gaps: [] });
    expect(prepareQl214Handoff(trial, repair, review, intake, 'rosiedazzlers', 'inbox')).toBe(intake);
    expect(draftQl214Intake(trial, repair, review, intake, 'rosiedazzlers', 'inbox', 'unknown' as 'unassigned', 'review')).toBe(intake);
    intake = draftQl214Intake(trial, repair, review, intake, 'rosiedazzlers', 'inbox', 'fictional_accessibility_reviewer',
      'Preview-only source and code evidence still needs independent verification');
    expect(upsertQl214Gap(trial, repair, review, intake, 'rosiedazzlers', 'inbox', {
      category: 'actual_repair', priority: 'P1', followUp: 'OPEN_UNVERIFIED', note: 'short' })).toBe(intake);
    intake = upsertQl214Gap(trial, repair, review, intake, 'rosiedazzlers', 'inbox', {
      category: 'actual_repair', priority: 'P1', followUp: 'OPEN_UNVERIFIED', note: 'Needs a real independently reviewed code diff' });
    expect(prepareQl214Handoff(trial, repair, review, intake, 'rosiedazzlers', 'inbox')).toBe(intake);
    intake = upsertQl214Gap(trial, repair, review, intake, 'rosiedazzlers', 'inbox', {
      category: 'actual_repair', priority: 'P1', followUp: 'FOLLOWUP_PLANNED', note: 'Schedule real code-diff review out of band' });
    expect(intake.rosiedazzlers?.inbox?.gaps).toHaveLength(1);
    intake = prepareQl214Handoff(trial, repair, review, intake, 'rosiedazzlers', 'inbox');
    expect(intake.rosiedazzlers?.inbox?.phase).toBe('local_handoff_prepared');
    expect(upsertQl214Gap(trial, repair, review, intake, 'rosiedazzlers', 'inbox', {
      category: 'provider_safety', priority: 'P0', followUp: 'FOLLOWUP_PLANNED', note: 'Provider readiness required' })).toBe(intake);
    expect(ql214CompanyReview(trial, repair, review, intake, 'rosiedazzlers')).toMatchObject({
      drafts: 1, handoffsPrepared: 1, gaps: 1, releaseHold: 'HELD_UNVERIFIED',
      ownerApproved: false, independentlyReviewed: false, livePilotReady: false });
    const receipt = ql214CompanyReceipt(trial, repair, review, intake, 'rosiedazzlers');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"independentApproval": false');
    expect(receipt).not.toContain('Needs a real independently');
    expect(receipt).not.toContain('Schedule real code-diff');
    expect(receipt).not.toContain('Preview-only source');
    expect(receipt).not.toContain(intake.rosiedazzlers!.inbox!.upstreamToken);
    expect(JSON.parse(receipt).prerequisites).toHaveLength(12);
  });

  it('freezes stale QL-213 evidence and counts withdrawn cases as unresolved rather than closing holds', () => {
    const { trial, repair, review } = prepared('yw');
    let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, 'yw', 'inbox');
    const alteredTrial = recordQl211Observation(trial, 'yw', 'inbox', { note: 'new source concern' });
    expect(ql214CompanyReview(alteredTrial, repair, review, intake, 'yw')).toMatchObject({ stale: 1, drafts: 0 });
    expect(draftQl214Intake(alteredTrial, repair, review, intake, 'yw', 'inbox', 'fictional_security_reviewer', 'fake')).toBe(intake);
    expect(prepareQl214Handoff(alteredTrial, repair, review, intake, 'yw', 'inbox')).toBe(intake);
    const changedReview = setQl213Check(trial, repair, review, 'yw', 'inbox', 'source', 'drafted_unverified',
      'Updated upstream fictional evidence note');
    expect(ql214CompanyReview(trial, repair, changedReview, intake, 'yw').stale).toBe(1);
    expect(beginQl214Intake(trial, repair, changedReview, intake, 'yw', 'inbox')).not.toBe(intake);
    intake = beginQl214Intake(trial, repair, changedReview, intake, 'yw', 'inbox');
    expect(intake.yw?.inbox).toMatchObject({ phase: 'intake_draft', reviewer: 'unassigned', gaps: [] });
    const withdrawn = recordQl211Observation(trial, 'yw', 'inbox', { outcome: 'not_run' });
    expect(ql214CompanyReview(withdrawn, repair, review, intake, 'yw')).toMatchObject({ orphaned: 1, stale: 1,
      openFindings: 0, releaseHold: 'HELD_UNVERIFIED' });
  });

  it('keeps two company intakes isolated and never turns synthetic preparation into live authorization', () => {
    const a = prepared('icamp'), b = prepared('devilndove');
    const trial = { ...a.trial, ...b.trial }, repair = { ...a.repair, ...b.repair }, review = { ...a.review, ...b.review };
    let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, 'icamp', 'inbox');
    intake = beginQl214Intake(trial, repair, review, intake, 'devilndove', 'inbox');
    intake = draftQl214Intake(trial, repair, review, intake, 'icamp', 'inbox', 'fictional_security_reviewer',
      'Only sample campground inquiries are in scope');
    expect(intake.devilndove?.inbox?.brief).toBe('');
    expect(ql214CompanyReview(trial, repair, review, intake, 'rosiedazzlers').cases).toEqual([]);
    expect(ql214Portfolio(trial, repair, review, intake)).toMatchObject({
      drafts: 2, evidenceGaps: 0, locallyPrepared: 0, livePilotReady: false, ownerApproved: false,
      callsPlaced: 0, messagesSent: 0, externalWrites: 0 });
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
  if (!button) throw new Error(`Missing button ${label}`);
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

describe('QL-214 four-company user journey', () => {
  it('keeps a fresh session empty and makes all twelve hold reasons visible', async () => {
    await click('Independent review intake & holds', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql214-release="${QL214_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('No QL-211 trial gaps have been reported here');
    expect(host.querySelectorAll('.ql214-scroll table tbody tr').length).toBe(16);
    expect(host.textContent).toContain('CONDITIONAL RELEASE BLOCKED');
    await click('ⓘ Intake help');
    expect(host.textContent).toContain('sends nothing');
    await click('Show PII-minimized company receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only independent review intake receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"realOwnerApproval": false');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('.ql214-register')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.textContent).toContain('No QL-211 trial gaps have been reported here');
  });

  it('navigates source trial and denies early reviewer intake before a QL-213 prepared packet', async () => {
    await click('Independent review intake & holds', '.ql172-nav-button');
    await click('Open QL-211 trial');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'fictional inbox issue');
    await click('Independent review intake & holds', '.ql172-nav-button');
    expect(host.textContent).toContain('An intake requires a current QL-213 packet');
    expect(host.textContent).not.toContain('Begin fictional independent-review intake');
    await click('Open QL-213 review prep');
    expect(host.textContent).toContain('No review draft');
  });

  it('guides a fictional four-step case into a local handoff with no independent approval', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'demo follow-up display issue');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Draft hypothetical follow-up accessibility change');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    for (const check of QL213_REVIEW_CHECKS) {
      await type(`#ql213-note-${check.id}`, `Fictional checklist reference for ${check.id}`);
      const button = host.querySelector<HTMLTextAreaElement>(`#ql213-note-${check.id}`)!
        .closest('.ql213-check')!.querySelector<HTMLButtonElement>('button')!;
      await act(async () => button.click());
    }
    expect(host.textContent).toContain('Packet prepared · UNVERIFIED');
    await click('Open QL-214 review intake & holds');
    expect(host.textContent).toContain('Begin fictional independent-review intake');
    await click('Begin fictional independent-review intake');
    await select('#ql214-reviewer', 'fictional_security_reviewer');
    await type('#ql214-brief', 'Reviewer should inspect sample source and focus repair independently');
    await select('#ql214-gap-followup', 'FOLLOWUP_PLANNED');
    await type('#ql214-gap-note', 'A real independent source repair inspection is still missing');
    await click('Save gap or update category');
    expect(host.textContent).toContain('Evidence gap and follow-up records (1)');
    await click('Prepare local handoff · NO DISPATCH');
    expect(host.textContent).toContain('local handoff prepared');
    expect(host.textContent).toContain('All evidence gaps and release controls remain open');
    await click('Show PII-minimized company receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only independent review intake receipt"]')?.value ?? '';
    expect(receipt).toContain('"phase": "local_handoff_prepared"');
    expect(receipt).toContain('"independentApproval": false');
    expect(receipt).not.toContain('A real independent source repair');
    expect(receipt).not.toContain('Reviewer should inspect sample');
    await click('Devil n Dove', '.ql172-brand');
    expect(host.textContent).toContain('No QL-211 trial gaps have been reported here');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('local handoff prepared');
  });
});
