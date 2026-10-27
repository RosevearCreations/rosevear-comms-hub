// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { ql238ReadCapabilities } from '../ql238HandshakeReadiness';
import { QL239_RELEASE, QL239_COMPANIES, QL239_CHECKS,
  ql239SyntheticProof, inspectQl239Proof, intakeQl239Proof, markQl239RotationChecklist,
  independentlyReviewQl239, resetQl239Company, ql239Portfolio, type Ql239Ledger
} from '../ql239GatewayProofReview';

const now = new Date('2026-10-27T14:00:00.000Z');

function genuineClaim(company: typeof QL239_COMPANIES[number]) {
  return {
    ...ql239SyntheticProof(company, now), kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
    sourceUrl: 'https://github.com/RosevearCreations/rosevear-comms-hub/pull/433',
    sourceRevision: 'a'.repeat(40), submitterAlias: 'operator_Alpha', evidenceId: 'proof-original-001'
  };
}

describe('QL-239 read-only four-company proof intake and independent HELD review', () => {
  it('allows only v1 health/capabilities proof references; 12 real holds never change', () => {
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every((gate) => gate.state === 'HELD_UNVERIFIED')).toBe(true);
    for (const company of QL239_COMPANIES) {
      const sample = ql239SyntheticProof(company, now);
      expect(sample.capabilities).toEqual(ql238ReadCapabilities(company));
      expect(sample.capabilities.every((value) => value.startsWith('read_'))).toBe(true);
      expect(inspectQl239Proof(sample, company, {}, now).disposition).toBe('PROOF_CLAIM_HELD');
    }
  });

  it('holds a complete external source claim without treating it as a verified connection', () => {
    const claim = genuineClaim('devilndove');
    let ledger = intakeQl239Proof({}, claim, 'devilndove', now);
    expect(ledger.devilndove).toMatchObject({
      disposition: 'PROOF_CLAIM_HELD', review: 'NOT_REVIEWED',
      credentialRun: 'NOT_RUN', actualConnection: 'DISCONNECTED',
      externalRequests: 0, externalWrites: 0, realApproval: false,
      liveCalls: 0, liveSms: 0, realPilotHolds: 12
    });
    expect(ledger.devilndove?.reason).toContain('Unverified');
    expect(independentlyReviewQl239(ledger, 'devilndove', 'reviewer_Beta')).toBe(ledger);
    ledger = markQl239RotationChecklist(ledger, 'devilndove');
    expect(ledger.devilndove?.credentialRun).toBe('SYNTHETIC_ROTATION_CHECKLIST_HELD');
    expect(independentlyReviewQl239(ledger, 'devilndove', 'operator_Alpha')).toBe(ledger);
    ledger = independentlyReviewQl239(ledger, 'devilndove', 'reviewer_Beta');
    expect(ledger.devilndove?.review).toBe('INDEPENDENT_REVIEW_DRAFT_HELD');
    expect(ledger.devilndove?.reviewerAlias).toBe('reviewer_Beta');
    expect(ledger.devilndove?.actualConnection).toBe('DISCONNECTED');
    expect(ql239Portfolio(ledger)).toHaveLength(4);
  });

  it('denies business spoofing, wrong tenants, unexpected fields and any write capability', () => {
    const sample = ql239SyntheticProof('icamp', now);
    expect(inspectQl239Proof({ ...sample, company: 'yw' }, 'icamp', {}, now).disposition).toBe('DENIED_SCOPE');
    expect(inspectQl239Proof({ ...sample, tenantId: 'demo-another-campground' }, 'icamp', {}, now).disposition).toBe('DENIED_TENANT');
    expect(inspectQl239Proof({ ...sample, tenantId: null }, 'icamp', {}, now).disposition).toBe('DENIED_TENANT');
    expect(inspectQl239Proof({ ...sample, gateway: 'devilndove' }, 'icamp', {}, now).disposition).toBe('DENIED_SCOPE');
    expect(inspectQl239Proof({ ...sample, environment: 'production' }, 'icamp', {}, now).disposition).toBe('DENIED_SCOPE');
    expect(inspectQl239Proof({ ...sample, method: 'POST' }, 'icamp', {}, now).disposition).toBe('DENIED_SCOPE');
    expect(inspectQl239Proof({ ...sample, capabilities: ['read_reservation_reference', 'send_sms'] }, 'icamp', {}, now).disposition).toBe('DENIED_CAPABILITY');
    expect(inspectQl239Proof({ ...sample, customerPhone: 'hidden' }, 'icamp', {}, now).disposition).toBe('DENIED_SCHEMA');
    expect(inspectQl239Proof({ ...sample, checks: { ...sample.checks, capturedToken: 'fake' } }, 'icamp', {}, now).disposition).toBe('DENIED_SCHEMA');
    const rejected = intakeQl239Proof({}, { ...sample, customerPhone: 'never-store-this' } as typeof sample, 'icamp', now);
    expect(rejected.icamp?.proof).toBeNull();
    expect(JSON.stringify(rejected)).not.toContain('never-store-this');
    const rosie = ql239SyntheticProof('rosiedazzlers', now);
    expect(inspectQl239Proof({ ...rosie, tenantId: 'demo-yw-tenant' }, 'rosiedazzlers', {}, now).disposition).toBe('DENIED_TENANT');
  });

  it('rejects incomplete checks, stale source proof, malformed provenance and duplicate evidence IDs', () => {
    const claim = genuineClaim('devilndove');
    expect(inspectQl239Proof({ ...claim, checks: { ...claim.checks, replayDenied: false } }, 'devilndove', {}, now).disposition).toBe('DENIED_CHECKS');
    expect(inspectQl239Proof({ ...claim, sourceUrl: 'https://not-authorized.example/secret' }, 'devilndove', {}, now).disposition).toBe('DENIED_EVIDENCE');
    expect(inspectQl239Proof({ ...claim, sourceRevision: 'branch-main' }, 'devilndove', {}, now).disposition).toBe('DENIED_EVIDENCE');
    expect(inspectQl239Proof({ ...claim, capabilitiesReceiptId: claim.healthReceiptId }, 'devilndove', {}, now).disposition).toBe('DENIED_EVIDENCE');
    expect(inspectQl239Proof({ ...claim, capturedAt: '2020-01-01T00:00:00.000Z' }, 'devilndove', {}, now).disposition).toBe('DENIED_STALE');
    const ledger = intakeQl239Proof({}, claim, 'devilndove', now);
    const copied = { ...ql239SyntheticProof('icamp', now), evidenceId: claim.evidenceId };
    expect(inspectQl239Proof(copied, 'icamp', ledger, now).disposition).toBe('DENIED_REPLAY');
    expect(QL239_CHECKS).toHaveLength(10);
  });

  it('keeps company-scoped evidence separate and resets independent review after new proof', () => {
    let ledger: Ql239Ledger = intakeQl239Proof({}, ql239SyntheticProof('rosiedazzlers', now), 'rosiedazzlers', now);
    ledger = intakeQl239Proof(ledger, ql239SyntheticProof('yw', new Date(now.getTime() + 1)), 'yw', new Date(now.getTime() + 1));
    const untouched = ledger.yw;
    ledger = markQl239RotationChecklist(ledger, 'rosiedazzlers');
    ledger = independentlyReviewQl239(ledger, 'rosiedazzlers', 'reviewer_Beta');
    expect(ledger.rosiedazzlers?.review).toBe('INDEPENDENT_REVIEW_DRAFT_HELD');
    ledger = resetQl239Company(ledger, 'rosiedazzlers');
    expect(ledger.rosiedazzlers).toBeUndefined();
    expect(ledger.yw).toBe(untouched);
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
  if (!button) throw new Error(`Missing button: ${label}`);
  await act(async () => button.click());
}

describe('QL-239 operator screen no-network acceptance', () => {
  it('shows four disconnected companies, help and unaltered live-pilot gates', async () => {
    await click('Gateway proof intake & rotation', '.ql172-nav-button');
    const screen = host.querySelector<HTMLElement>('[data-ql239-release]');
    expect(screen?.getAttribute('data-ql239-release')).toBe(QL239_RELEASE);
    expect(screen?.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(screen?.textContent).toContain('NO REAL INTEGRATION ACTIVE');
    expect(screen?.textContent).toContain('12/12 HELD');
    await click('Proof intake help');
    expect(screen?.textContent).toContain('Never paste actual keys');
  });

  it('intakes a fictional proof, rehearses rotation, independent review and reset without network/storage', async () => {
    const net = vi.spyOn(globalThis, 'fetch');
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await click('Gateway proof intake & rotation', '.ql172-nav-button');
    await click('Rehearse fictional proof');
    expect(host.textContent).toContain('PROOF_CLAIM_HELD');
    await click('Mark rotation review checklist');
    const reviewer = host.querySelector<HTMLInputElement>('.ql239-reviewer input')!;
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; setter.call(reviewer, 'reviewer_Beta'); reviewer.dispatchEvent(new Event('input', { bubbles: true })); });
    await click('Prepare independent review');
    expect(host.textContent).toContain('INDEPENDENT_REVIEW_DRAFT_HELD');
    expect(host.textContent).toContain('Connection:');
    expect(net).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
    await click('Reset this company');
    expect(host.querySelector('.ql239-result')?.textContent).toContain('NO EVIDENCE RECEIVED');
  });

  it('does not copy evidence between companies, and offers keyboard/mobile styles', async () => {
    await click('Gateway proof intake & rotation', '.ql172-nav-button');
    await click('Rehearse fictional proof');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector<HTMLElement>('[data-ql239-release]')?.getAttribute('data-company')).toBe('icamp');
    expect(host.querySelector('.ql239-result')?.textContent).toContain('NO EVIDENCE RECEIVED');
    const rosie = [...host.querySelectorAll('tbody tr')].find((row) => row.textContent?.includes('Rosie Dazzlers'));
    expect(rosie?.textContent).toContain('PROOF_CLAIM_HELD');
    const css = readFileSync('src/operator/ql239-gateway-proof-review.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('max-width: 650px');
    expect(css).toContain('forced-colors');
  });
});
