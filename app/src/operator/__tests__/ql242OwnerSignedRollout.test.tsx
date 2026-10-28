// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { ql239SyntheticProof, intakeQl239Proof, markQl239RotationChecklist,
  independentlyReviewQl239, type Ql239Ledger } from '../ql239GatewayProofReview';
import { QL240_CHECKS, recordQl240Claim, independentlyReviewQl240 } from '../ql240PilotDecision';
import { QL241_RELEASE, QL241_CHECKS, recordQl241Report,
  ql241PrepareOwnerReview } from '../ql241ExternalProofReadiness';
import { QL242_RELEASE, inspectQl242Report, recordQl242Report,
  ql242CurrentStatus, advanceQl242Rehearsal, resetQl242Company,
  ql242Portfolio, type Ql242Ledger } from '../ql242OwnerSignedRollout';

const now = new Date('2026-10-27T14:00:00.000Z');
type Company = 'devilndove' | 'rosiedazzlers' | 'icamp' | 'yw';
function rig(company: Company = 'devilndove') {
  const proof = { ...ql239SyntheticProof(company, now), kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
    sourceUrl: 'https://github.com/RosevearCreations/rosevear-comms-hub/pull/439',
    sourceRevision: 'a'.repeat(40), submitterAlias: 'source_team_1' };
  let source = intakeQl239Proof({}, proof, company, now);
  source = markQl239RotationChecklist(source, company);
  source = independentlyReviewQl239(source, company, 'source_reviewer_2');
  const auditClaim = { company, sourceEvidenceId: proof.evidenceId,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayAuditId: 'np-gateway-audit-001', currentKeyId: 'np-current-001',
    revokedKeyId: 'np-previous-001', inspectorAlias: 'inspector_team_3',
    observedAt: now.toISOString(),
    checks: Object.fromEntries(QL240_CHECKS.map((key) => [key, true])) as Record<typeof QL240_CHECKS[number], boolean> };
  let audit = recordQl240Claim({}, source, company, auditClaim, now);
  audit = independentlyReviewQl240(audit, source, company, 'reviewer_team_4');
  const getReport = { release: QL241_RELEASE, status: 'SIGNED_GET_PAIR_CHECKED_HELD',
    reason: 'Isolated signed GET receipts (unattested).', signedGetReceiptsVerified: true,
    independentlyVerifiedPinProvenance: false, gatewayAuditIndependentlyVerified: false,
    realOwnerAuthorization: false, actualConnection: 'DISCONNECTED', externalGetAttempts: 2,
    externalWrites: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, tenantId: proof.tenantId, keyId: auditClaim.currentKeyId,
    publicKeyFingerprintSha256: 'b'.repeat(64),
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId };
  let external = recordQl241Report({}, getReport, company, audit, source);
  const checks = Object.fromEntries(QL241_CHECKS.map((key) => [key, true])) as Record<typeof QL241_CHECKS[number], boolean>;
  external = ql241PrepareOwnerReview(external, company, audit, source, 'owner_review_team_5', checks);
  const report = { release: QL242_RELEASE, status: 'DUAL_SIGNATURES_CHECKED_HELD',
    reason: 'Offline synthetic signatures; no independent identity proof.',
    signedAuditCompared: true, signedOwnerDecisionCompared: true,
    independentlyWitnessedProvenance: false, ownerIdentityVerified: false,
    actualOwnerAuthorization: false, realGatewayConnection: 'DISCONNECTED',
    rehearsalState: 'AUDIT_REVIEW_ONLY_HELD', externalRequests: 0,
    externalWrites: 0, liveCalls: 0, liveSms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, gatewayAuditId: auditClaim.gatewayAuditId, sourceRevision: proof.sourceRevision,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayPublicKeyFingerprintSha256: 'b'.repeat(64), ownerPublicKeyFingerprintSha256: 'c'.repeat(64),
    rollbackReceiptId: 'np-rollback-receipt-001', ownerDecision: 'REQUEST_READ_ONLY_REHEARSAL',
    transitions: [] as unknown[] };
  return { source, audit, external, proof, report };
}

describe('QL-242 audit/owner receipt reference reconciliation', () => {
  it('preserves four real disconnected companies, all QL-181 holds and no automatic owner approval', () => {
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every((x) => x.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(ql242Portfolio({}, {}, {}, {})).toHaveLength(4);
    expect(ql242Portfolio({}, {}, {}, {}).every((row) => row.actualConnection === 'DISCONNECTED' && row.realPilotHolds === 12)).toBe(true);
    expect(inspectQl242Report({}, 'devilndove', {}, {}, {}).status).toBe('UPSTREAM_MISSING_HELD');
  });

  it('only accepts exact source-linked Devil n Dove JSON as unverified local signature references', () => {
    const x = rig();
    expect(x.external.devilndove?.request).toBe('OWNER_READ_ONLY_AUTHORIZATION_REVIEW_DRAFT_HELD');
    const decision = inspectQl242Report(x.report, 'devilndove', x.source, x.audit, x.external);
    expect(decision.status).toBe('SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD');
    expect(decision).toMatchObject({ actualOwnerAuthorization: false,
      ownerIdentityVerified: false, actualConnection: 'DISCONNECTED', liveCalls: 0,
      liveSms: 0, externalWrites: 0, providerDispatch: 0, realPilotHolds: 12 });
    expect(JSON.stringify(decision)).not.toContain(x.report.reason);
    const y = rig('yw');
    expect(inspectQl242Report(y.report, 'yw', y.source, y.audit, y.external).status).toBe('UPSTREAM_MISSING_HELD');
  });

  it('rejects forged consent, source/key mismatch, unknown report fields and a performed CLI rehearsal', () => {
    const x = rig();
    const run = (data: unknown) => inspectQl242Report(data, 'devilndove', x.source, x.audit, x.external).status;
    expect(run({ ...x.report, actualOwnerAuthorization: true })).toBe('DENIED_SCOPE');
    expect(run({ ...x.report, realGatewayConnection: 'CONNECTED' })).toBe('DENIED_SCOPE');
    expect(run({ ...x.report, ownerDecision: 'APPROVE_LIVE_SMS' })).toBe('DENIED_SCOPE');
    expect(run({ ...x.report, gatewayAuditId: 'np-drifted-audit-001' })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, gatewayPublicKeyFingerprintSha256: 'd'.repeat(64) })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, ownerPublicKeyFingerprintSha256: 'b'.repeat(64) })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, token: 'SECRET_SHOULD_NOT_PERSIST' })).toBe('DENIED_SCHEMA');
    expect(run({ ...x.report, transitions: [{ state: 'SIMULATED_READ_ONLY_HELD' }] })).toBe('DENIED_SCHEMA');
    const ledger = recordQl242Report({}, { ...x.report, token: 'SECRET_SHOULD_NOT_PERSIST' }, 'devilndove', x.source, x.audit, x.external);
    expect(JSON.stringify(ledger)).not.toContain('SECRET_SHOULD_NOT_PERSIST');
  });

  it('allows a separate reviewer to prepare, simulate, and roll back only session state', () => {
    const x = rig();
    const initial = recordQl242Report({}, x.report, 'devilndove', x.source, x.audit, x.external);
    expect(advanceQl242Rehearsal(initial, 'devilndove', 'simulate', 'team_reviewer_6', x.source, x.audit, x.external)).toBe(initial);
    expect(advanceQl242Rehearsal(initial, 'devilndove', 'prepare', 'source_team_1', x.source, x.audit, x.external)).toBe(initial);
    expect(advanceQl242Rehearsal(initial, 'devilndove', 'prepare', 'owner_review_team_5', x.source, x.audit, x.external)).toBe(initial);
    let ledger = advanceQl242Rehearsal(initial, 'devilndove', 'prepare', 'team_reviewer_6', x.source, x.audit, x.external);
    expect(ledger.devilndove?.stage).toBe('REVIEW_PREPARED_HELD');
    ledger = advanceQl242Rehearsal(ledger, 'devilndove', 'simulate', 'team_reviewer_6', x.source, x.audit, x.external);
    expect(ledger.devilndove?.stage).toBe('SIMULATED_READ_ONLY_HELD');
    expect(ledger.devilndove?.actualConnection).toBe('DISCONNECTED');
    ledger = advanceQl242Rehearsal(ledger, 'devilndove', 'rollback', 'team_reviewer_6', x.source, x.audit, x.external);
    expect(ledger.devilndove?.stage).toBe('ROLLED_BACK_HELD');
    expect(ledger.devilndove?.actualOwnerAuthorization).toBe(false);
    expect(advanceQl242Rehearsal(ledger, 'devilndove', 'simulate', 'team_reviewer_6', x.source, x.audit, x.external)).toBe(ledger);
  });

  it('freezes source drift, preserves rollback path and resets one company only', () => {
    const x = rig();
    let ledger = recordQl242Report({}, x.report, 'devilndove', x.source, x.audit, x.external);
    ledger = advanceQl242Rehearsal(ledger, 'devilndove', 'prepare', 'team_reviewer_6', x.source, x.audit, x.external);
    ledger = advanceQl242Rehearsal(ledger, 'devilndove', 'simulate', 'team_reviewer_6', x.source, x.audit, x.external);
    const changed: Ql239Ledger = { ...x.source,
      devilndove: { ...x.source.devilndove!, proof: { ...x.proof, sourceRevision: 'd'.repeat(40) } } };
    expect(ql242CurrentStatus(ledger.devilndove, 'devilndove', changed, x.audit, x.external)).toBe('SOURCE_DRIFT_HELD');
    expect(advanceQl242Rehearsal(ledger, 'devilndove', 'prepare', 'reviewer_extra', changed, x.audit, x.external)).toBe(ledger);
    const rolled = advanceQl242Rehearsal(ledger, 'devilndove', 'rollback', 'team_reviewer_6', changed, x.audit, x.external);
    expect(rolled.devilndove?.stage).toBe('ROLLED_BACK_HELD');
    const extra = { ...rolled, icamp: { ...rolled.devilndove! } } as Ql242Ledger;
    expect(resetQl242Company(extra, 'devilndove').icamp).toBe(extra.icamp);
  });
});

let host: HTMLDivElement; let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function click(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((x) => x.textContent?.includes(text));
  if (!button) throw new Error('Missing button: ' + text);
  await act(async () => button.click());
}
describe('QL-242 operator interface is held, scoped, and accessible', () => {
  it('renders all four businesses and twelve holds with helpful navigation', async () => {
    await click('Gateway audit & rollback HOLD', '.ql172-nav-button');
    const screen = host.querySelector<HTMLElement>('[data-ql242-release]')!;
    expect(screen.getAttribute('data-ql242-release')).toBe(QL242_RELEASE);
    expect(screen.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(screen.textContent).toContain('ACTUAL CONNECTION: DISCONNECTED');
    expect(screen.textContent).toContain('12/12 HELD');
    expect(screen.textContent).toContain('Real owner authorization: NO');
    await click('Audit & rollback help');
    expect(screen.textContent).toContain('ql242-verify-audit-owner.mjs');
    expect(screen.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    await click('Devil n Dove', '.ql172-brand');
    expect(host.querySelector<HTMLButtonElement>('[data-ql242-release] form button[type=submit]')?.disabled).toBe(false);
  });

  it('never fetches gateways, persists records or lets iCamp request a pilot', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch'); const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await click('Gateway audit & rollback HOLD', '.ql172-nav-button');
    await click('iCamp', '.ql172-brand');
    const screen = host.querySelector<HTMLElement>('[data-ql242-release]')!;
    expect(screen.getAttribute('data-company')).toBe('icamp');
    expect(screen.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled(); expect(storageSpy).not.toHaveBeenCalled();
    const css = readFileSync('src/operator/ql242-owner-signed-rollout.css', 'utf8');
    expect(css).toContain('@media (max-width: 650px)');
    expect(css).toContain(':focus-visible');
  });
});
