// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { ql239SyntheticProof, intakeQl239Proof, markQl239RotationChecklist,
  independentlyReviewQl239, type Ql239Ledger } from '../ql239GatewayProofReview';
import { QL240_CHECKS, recordQl240Claim, independentlyReviewQl240, type Ql240Ledger } from '../ql240PilotDecision';
import { QL241_RELEASE, QL241_CHECKS, inspectQl241Report, ql241Portfolio, ql241CurrentStatus,
  recordQl241Report, ql241PrepareOwnerReview, resetQl241Company, type Ql241Ledger } from '../ql241ExternalProofReadiness';

const now = new Date('2026-10-27T14:00:00.000Z');
type Company = 'devilndove' | 'rosiedazzlers' | 'icamp' | 'yw';
function fixture(company: Company) {
  const proof = { ...ql239SyntheticProof(company, now), kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
    sourceUrl: 'https://github.com/RosevearCreations/rosevear-comms-hub/pull/435',
    sourceRevision: 'a'.repeat(40), submitterAlias: 'source_team_1' };
  let source = intakeQl239Proof({}, proof, company, now);
  source = markQl239RotationChecklist(source, company);
  source = independentlyReviewQl239(source, company, 'source_reviewer_2');
  const candidate = { company, sourceEvidenceId: proof.evidenceId, healthReceiptId: proof.healthReceiptId,
    capabilitiesReceiptId: proof.capabilitiesReceiptId, gatewayAuditId: 'audit-receipt-001',
    currentKeyId: 'np-current-001', revokedKeyId: 'np-previous-001', inspectorAlias: 'inspector_team_3',
    observedAt: now.toISOString(), checks: Object.fromEntries(QL240_CHECKS.map((key) => [key, true])) as Record<typeof QL240_CHECKS[number], boolean> };
  let audits = recordQl240Claim({}, source, company, candidate, now);
  audits = independentlyReviewQl240(audits, source, company, 'reviewer_team_4');
  const report = { release: QL241_RELEASE, status: 'SIGNED_GET_PAIR_CHECKED_HELD',
    reason: 'Test-only signatures; independent proof still required.', signedGetReceiptsVerified: true,
    independentlyVerifiedPinProvenance: false, gatewayAuditIndependentlyVerified: false,
    realOwnerAuthorization: false, actualConnection: 'DISCONNECTED', externalGetAttempts: 2,
    externalWrites: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, tenantId: proof.tenantId, keyId: candidate.currentKeyId,
    publicKeyFingerprintSha256: 'b'.repeat(64),
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId };
  return { source, audits, report, proof };
}

describe('QL-241 external report reconciliation and owner-only draft', () => {
  it('starts with four disconnected companies, no real proof, and twelve unchanged holds', () => {
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every((x) => x.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(ql241Portfolio({}, {}, {})).toHaveLength(4);
    expect(ql241Portfolio({}, {}, {}).every((x) => x.connection === 'DISCONNECTED' && x.holds === 12)).toBe(true);
    expect(inspectQl241Report({}, 'devilndove', {}, {}).status).toBe('UPSTREAM_NOT_READY_HELD');
  });

  it('accepts only sanitized matching held reports as UNATTESTED references for every company', () => {
    for (const company of ['devilndove', 'rosiedazzlers', 'icamp', 'yw'] as const) {
      const x = fixture(company);
      expect(inspectQl241Report(x.report, company, x.audits, x.source).status).toBe('EXTERNAL_REPORT_RECEIVED_UNATTESTED_HELD');
      const ledger = recordQl241Report({}, x.report, company, x.audits, x.source);
      expect(ledger[company]).toMatchObject({ realOwnerAuthorization: false, realCryptographicProofIndependentlyAttested: false,
        actualConnection: 'DISCONNECTED', providerDispatch: 0, liveCalls: 0, liveSms: 0, realPilotHolds: 12 });
      expect(JSON.stringify(ledger)).not.toContain('Test-only signatures');
    }
  });

  it('rejects forged approvals, foreign business/tenant, secret fields, mismatched key and receipt IDs', () => {
    const x = fixture('icamp');
    const status = (value: unknown) => inspectQl241Report(value, 'icamp', x.audits, x.source).status;
    expect(status({ ...x.report, company: 'yw' })).toBe('DENIED_SCOPE');
    expect(status({ ...x.report, tenantId: 'demo-other-campground' })).toBe('DENIED_SCOPE');
    expect(status({ ...x.report, realOwnerAuthorization: true })).toBe('DENIED_SCOPE');
    expect(status({ ...x.report, actualConnection: 'CONNECTED' })).toBe('DENIED_SCOPE');
    expect(status({ ...x.report, calls: 1 })).toBe('DENIED_SCOPE');
    expect(status({ ...x.report, privateKey: 'NEVER RETAIN' })).toBe('DENIED_REPORT');
    expect(status({ ...x.report, healthReceiptId: 'np-foreign-health-0001' })).toBe('DENIED_SOURCE');
    expect(status({ ...x.report, keyId: 'np-foreign-current' })).toBe('DENIED_SOURCE');
    expect(status({ ...x.report, publicKeyFingerprintSha256: 'unverified' })).toBe('DENIED_PIN');
    const ledger = recordQl241Report({}, { ...x.report, privateKey: 'NEVER RETAIN' }, 'icamp', x.audits, x.source);
    expect(JSON.stringify(ledger)).not.toContain('NEVER RETAIN');
  });

  it('permits only a separate Devil n Dove authorization REQUEST DRAFT, never approval', () => {
    const x = fixture('devilndove');
    const allChecks = Object.fromEntries(QL241_CHECKS.map((key) => [key, true])) as Record<typeof QL241_CHECKS[number], boolean>;
    let ledger = recordQl241Report({}, x.report, 'devilndove', x.audits, x.source);
    expect(ql241PrepareOwnerReview(ledger, 'devilndove', x.audits, x.source, 'source_team_1', allChecks)).toBe(ledger);
    expect(ql241PrepareOwnerReview(ledger, 'devilndove', x.audits, x.source, 'inspector_team_3', allChecks)).toBe(ledger);
    expect(ql241PrepareOwnerReview(ledger, 'devilndove', x.audits, x.source, 'owner_review_team_5', { ...allChecks, rollbackAndExpiryReviewed: false })).toBe(ledger);
    ledger = ql241PrepareOwnerReview(ledger, 'devilndove', x.audits, x.source, 'owner_review_team_5', allChecks);
    expect(ledger.devilndove?.request).toBe('OWNER_READ_ONLY_AUTHORIZATION_REVIEW_DRAFT_HELD');
    expect(ledger.devilndove?.realOwnerAuthorization).toBe(false);
    const y = fixture('yw');
    const other = recordQl241Report({}, y.report, 'yw', y.audits, y.source);
    expect(ql241PrepareOwnerReview(other, 'yw', y.audits, y.source, 'owner_review_team_5', allChecks)).toBe(other);
  });

  it('freezes downstream request on upstream evidence change and resets one company only', () => {
    const x = fixture('devilndove');
    let ledger: Ql241Ledger = recordQl241Report({}, x.report, 'devilndove', x.audits, x.source);
    const rosy = fixture('rosiedazzlers');
    ledger = recordQl241Report(ledger, rosy.report, 'rosiedazzlers', rosy.audits, rosy.source);
    const other = ledger.rosiedazzlers;
    const changed: Ql239Ledger = { ...x.source,
      devilndove: { ...x.source.devilndove!, proof: { ...x.proof, sourceRevision: 'c'.repeat(40) } } };
    expect(ql241CurrentStatus(ledger.devilndove, 'devilndove', x.audits, changed)).toBe('SOURCE_DRIFT_HELD');
    expect(ql241Portfolio(ledger, x.audits, changed).find((x) => x.company === 'devilndove')?.request).toBe('NONE');
    ledger = resetQl241Company(ledger, 'devilndove');
    expect(ledger.rosiedazzlers).toBe(other);
    expect(ledger.devilndove).toBeUndefined();
  });
});

let root: Root; let host: HTMLDivElement;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function click(text: string, selector = 'button') {
  const node = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((x) => x.textContent?.includes(text));
  if (!node) throw new Error('Missing button: ' + text);
  await act(async () => node.click());
}

describe('QL-241 operator review UI', () => {
  it('shows accessible help, four-company source matrix and the explicitly held owner gate', async () => {
    await click('External GET proof & owner HOLD', '.ql172-nav-button');
    const screen = host.querySelector<HTMLElement>('[data-ql241-release]')!;
    expect(screen.getAttribute('data-ql241-release')).toBe(QL241_RELEASE);
    expect(screen.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(screen.textContent).toContain('ALL FOUR COMPANIES: DISCONNECTED');
    expect(screen.textContent).toContain('12/12 HELD');
    expect(screen.textContent).toContain('Real owner authorization: NO');
    await click('Evidence help');
    expect(screen.textContent).toContain('allow-nonproduction-https-get');
    expect(screen.querySelector<HTMLButtonElement>('.ql241-actions button[disabled]')).toBeTruthy();
  });

  it('keeps all verification offline from browser and separates each company', async () => {
    const net = vi.spyOn(globalThis, 'fetch'); const save = vi.spyOn(Storage.prototype, 'setItem');
    await click('External GET proof & owner HOLD', '.ql172-nav-button');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-ql241-release]')?.getAttribute('data-company')).toBe('icamp');
    expect(host.textContent).toContain('NOT_STARTED');
    expect(net).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
    const css = readFileSync('src/operator/ql241-external-proof-readiness.css', 'utf8');
    expect(css).toContain('@media (max-width: 650px)');
    expect(css).toContain(':focus-visible');
  });
});
