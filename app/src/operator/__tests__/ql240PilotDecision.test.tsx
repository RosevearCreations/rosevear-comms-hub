// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import {
  ql239SyntheticProof, intakeQl239Proof, markQl239RotationChecklist, independentlyReviewQl239,
  type Ql239Ledger
} from '../ql239GatewayProofReview';
import {
  QL240_RELEASE, QL240_CHECKS, inspectQl240Claim, ql240EligibleSource,
  recordQl240Claim, independentlyReviewQl240, decideQl240HeldPilot,
  ql240Portfolio, ql240CurrentStatus, resetQl240Company, type Ql240Ledger
} from '../ql240PilotDecision';

const now = new Date('2026-10-27T14:00:00.000Z');

function source(company: 'devilndove' | 'rosiedazzlers' | 'icamp' | 'yw') {
  const proof = {
    ...ql239SyntheticProof(company, now), kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
    sourceUrl: 'https://github.com/RosevearCreations/rosevear-comms-hub/pull/435',
    sourceRevision: 'a'.repeat(40), submitterAlias: 'source_team_1'
  };
  let ledger = intakeQl239Proof({}, proof, company, now);
  ledger = markQl239RotationChecklist(ledger, company);
  ledger = independentlyReviewQl239(ledger, company, 'source_reviewer_2');
  return { ledger, proof };
}

function claim(company: 'devilndove' | 'rosiedazzlers' | 'icamp' | 'yw') {
  const x = source(company);
  const checks = Object.fromEntries(QL240_CHECKS.map((key) => [key, true])) as Record<typeof QL240_CHECKS[number], boolean>;
  return { ...x, candidate: {
    company, sourceEvidenceId: x.proof.evidenceId,
    healthReceiptId: x.proof.healthReceiptId, capabilitiesReceiptId: x.proof.capabilitiesReceiptId,
    gatewayAuditId: 'audit-receipt-001', currentKeyId: 'np-current-001',
    revokedKeyId: 'np-old-001', inspectorAlias: 'inspector_team_3', observedAt: now.toISOString(), checks
  } };
}

describe('QL-240 independent nonproduction receipt and owner-safe pilot decision gate', () => {
  it('keeps all 12 real holds and rejects absent/demo-only QL-239 evidence', () => {
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every((item) => item.state === 'HELD_UNVERIFIED')).toBe(true);
    for (const company of ['rosiedazzlers', 'devilndove', 'yw', 'icamp'] as const) {
      const sample = ql239SyntheticProof(company, now);
      expect(ql240EligibleSource(undefined)).toBe(false);
      expect(inspectQl240Claim({}, company, undefined, now).status).toBe('SOURCE_NOT_RETURNED_HELD');
      const demos = intakeQl239Proof({}, sample, company, now);
      expect(inspectQl240Claim({}, company, demos[company], now).status).toBe('SOURCE_NOT_RETURNED_HELD');
    }
  });

  it('only reconciles exact source-linked health/capabilities and gateway receipt references as unverified HELD claims', () => {
    for (const company of ['rosiedazzlers', 'devilndove', 'yw', 'icamp'] as const) {
      const x = claim(company);
      expect(ql240EligibleSource(x.ledger[company])).toBe(true);
      expect(inspectQl240Claim(x.candidate, company, x.ledger[company], now).status).toBe('NONPRODUCTION_CLAIMS_RECONCILED_HELD');
      const after = recordQl240Claim({}, x.ledger, company, x.candidate, now);
      expect(after[company]).toMatchObject({
        actualConnection: 'DISCONNECTED', realCryptographicGatewayProof: false,
        realOwnerApproval: false, liveCalls: 0, liveSms: 0, providerDispatch: 0, externalWrites: 0,
        independentReview: 'NOT_REVIEWED', decision: 'HOLD', realPilotHolds: 12
      });
      expect(ql240Portfolio(after, x.ledger)).toHaveLength(4);
    }
  });

  it('fails closed on mismatched receipts, business/key aliases, extra private fields and missing checks', () => {
    const x = claim('icamp');
    const run = (data: unknown) => inspectQl240Claim(data, 'icamp', x.ledger.icamp, now).status;
    expect(run({ ...x.candidate, company: 'yw' })).toBe('DENIED_SCOPE');
    expect(run({ ...x.candidate, healthReceiptId: 'foreign-receipt' })).toBe('DENIED_RECEIPT');
    expect(run({ ...x.candidate, gatewayAuditId: x.candidate.healthReceiptId })).toBe('DENIED_RECEIPT');
    expect(run({ ...x.candidate, revokedKeyId: x.candidate.currentKeyId })).toBe('DENIED_KEY');
    expect(run({ ...x.candidate, currentKeyId: 'production-secret' })).toBe('DENIED_KEY');
    expect(run({ ...x.candidate, inspectorAlias: 'source_team_1' })).toBe('DENIED_CHECKS');
    expect(run({ ...x.candidate, inspectorAlias: 'source_reviewer_2' })).toBe('DENIED_CHECKS');
    expect(run({ ...x.candidate, checks: { ...x.candidate.checks, revokedPreviousKeyRejected: false } })).toBe('DENIED_CHECKS');
    expect(run({ ...x.candidate, token: 'private-value' })).toBe('DENIED_SCHEMA');
    expect(run({ ...x.candidate, observedAt: '2020-01-01T00:00:00.000Z' })).toBe('DENIED_FRESHNESS');
    const rejected = recordQl240Claim({}, x.ledger, 'icamp', { ...x.candidate, secret: 'never-store-this' }, now);
    expect(rejected.icamp?.claim).toBeNull();
    expect(JSON.stringify(rejected)).not.toContain('never-store-this');
  });

  it('requires a fourth distinct reviewer and only marks Devil n Dove as an unapproved future read-only candidate', () => {
    const x = claim('devilndove');
    let ledger = recordQl240Claim({}, x.ledger, 'devilndove', x.candidate, now);
    expect(decideQl240HeldPilot(ledger, x.ledger, 'devilndove', 'READ_ONLY_CANDIDATE_HELD')).toBe(ledger);
    expect(independentlyReviewQl240(ledger, x.ledger, 'devilndove', 'inspector_team_3')).toBe(ledger);
    expect(independentlyReviewQl240(ledger, x.ledger, 'devilndove', 'source_team_1')).toBe(ledger);
    ledger = independentlyReviewQl240(ledger, x.ledger, 'devilndove', 'reviewer_team_4');
    expect(ledger.devilndove?.independentReview).toBe('SEPARATE_REVIEW_DRAFT_HELD');
    ledger = decideQl240HeldPilot(ledger, x.ledger, 'devilndove', 'READ_ONLY_CANDIDATE_HELD');
    expect(ledger.devilndove?.decision).toBe('READ_ONLY_CANDIDATE_HELD');
    expect(ledger.devilndove?.realOwnerApproval).toBe(false);
    expect(ledger.devilndove?.actualConnection).toBe('DISCONNECTED');
    const camp = claim('icamp');
    let campLedger = recordQl240Claim({}, camp.ledger, 'icamp', camp.candidate, now);
    campLedger = independentlyReviewQl240(campLedger, camp.ledger, 'icamp', 'reviewer_team_4');
    expect(decideQl240HeldPilot(campLedger, camp.ledger, 'icamp', 'READ_ONLY_CANDIDATE_HELD')).toBe(campLedger);
    expect(decideQl240HeldPilot(campLedger, camp.ledger, 'icamp', 'REQUEST_REAL_VERIFICATION_HELD').icamp?.decision).toBe('REQUEST_REAL_VERIFICATION_HELD');
  });

  it('invalidates a held candidate when QL-239 source changes and resets only its own company', () => {
    const x = claim('devilndove');
    let ledger: Ql240Ledger = recordQl240Claim({}, x.ledger, 'devilndove', x.candidate, now);
    const rosie = claim('rosiedazzlers');
    ledger = recordQl240Claim(ledger, rosie.ledger, 'rosiedazzlers', rosie.candidate, now);
    const originalRosie = ledger.rosiedazzlers;
    const changed: Ql239Ledger = {
      ...x.ledger, devilndove: { ...x.ledger.devilndove!, proof: { ...x.proof, evidenceId: 'new-source-proof-001' } }
    };
    expect(ql240CurrentStatus(ledger.devilndove, changed.devilndove)).toBe('SOURCE_DRIFT_HELD');
    expect(independentlyReviewQl240(ledger, changed, 'devilndove', 'reviewer_team_4')).toBe(ledger);
    expect(decideQl240HeldPilot(ledger, changed, 'devilndove', 'READ_ONLY_CANDIDATE_HELD')).toBe(ledger);
    ledger = resetQl240Company(ledger, 'devilndove');
    expect(ledger.rosiedazzlers).toBe(originalRosie);
    expect(ledger.devilndove).toBeUndefined();
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(label));
  if (!button) throw new Error('Missing button ' + label);
  await act(async () => button.click());
}

describe('QL-240 safe operator receipt verification gate', () => {
  it('shows all four disconnected businesses with genuine-proof requirement and accessible help', async () => {
    await click('Nonproduction receipts & pilot HOLD', '.ql172-nav-button');
    const screen = host.querySelector<HTMLElement>('[data-ql240-release]');
    expect(screen?.getAttribute('data-ql240-release')).toBe(QL240_RELEASE);
    expect(screen?.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(screen?.textContent).toContain('ALL REAL GATEWAY CONNECTIONS DISCONNECTED');
    expect(screen?.textContent).toContain('12/12 HELD');
    expect(screen?.textContent).toContain('MISSING OR DEMO ONLY');
    await click('Verification help');
    expect(screen?.textContent).toContain('independent reviewer must inspect');
  });

  it('refuses a mock QL-239 sample as verification evidence, makes no network or storage calls', async () => {
    const net = vi.spyOn(globalThis, 'fetch'); const storage = vi.spyOn(Storage.prototype, 'setItem');
    await click('Gateway proof intake & rotation', '.ql172-nav-button');
    await click('Rehearse fictional proof only');
    await click('Nonproduction receipts & pilot HOLD', '.ql172-nav-button');
    const form = host.querySelector<HTMLElement>('.ql240-form');
    expect(form?.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(host.textContent).toContain('MISSING OR DEMO ONLY');
    expect(host.textContent).toContain('DISCONNECTED');
    expect(net).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
  });

  it('never moves another business proof and provides responsive/keyboard-safe styles', async () => {
    await click('Nonproduction receipts & pilot HOLD', '.ql172-nav-button');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-ql240-release]')?.getAttribute('data-company')).toBe('icamp');
    expect(host.textContent).toContain('NOT_STARTED');
    const css = readFileSync('src/operator/ql240-pilot-decision.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('max-width: 650px');
    expect(css).toContain('forced-colors');
  });
});
