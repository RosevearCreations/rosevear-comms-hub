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
import { QL242_RELEASE, recordQl242Report } from '../ql242OwnerSignedRollout';
import { QL243_RELEASE, QL243_BLOCKERS, QL243_SIX_APPS,
  inspectQl243Report, ql243CurrentStatus, ql243Portfolio } from '../ql243ConnectionTesting';

function rig() {
  const now = new Date('2026-10-27T14:00:00.000Z');
  const company = 'devilndove';
  const proof = { ...ql239SyntheticProof(company, now), kind: 'EXTERNAL_CLAIM_UNVERIFIED' as const,
    sourceUrl: 'https://github.com/RosevearCreations/rosevear-comms-hub/pull/439',
    sourceRevision: 'a'.repeat(40), submitterAlias: 'source_team_1' };
  let source = intakeQl239Proof({}, proof, company, now);
  source = markQl239RotationChecklist(source, company);
  source = independentlyReviewQl239(source, company, 'source_reviewer_2');
  const claim = { company, sourceEvidenceId: proof.evidenceId,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayAuditId: 'np-gateway-audit-001', currentKeyId: 'np-current-001',
    revokedKeyId: 'np-previous-001', inspectorAlias: 'inspector_team_3',
    observedAt: now.toISOString(),
    checks: Object.fromEntries(QL240_CHECKS.map(key => [key, true])) as Record<typeof QL240_CHECKS[number], boolean> };
  let audit = recordQl240Claim({}, source, company, claim, now);
  audit = independentlyReviewQl240(audit, source, company, 'reviewer_team_4');
  const getReport = { release: QL241_RELEASE, status: 'SIGNED_GET_PAIR_CHECKED_HELD',
    reason: 'Isolated signed GET receipts.', signedGetReceiptsVerified: true,
    independentlyVerifiedPinProvenance: false, gatewayAuditIndependentlyVerified: false,
    realOwnerAuthorization: false, actualConnection: 'DISCONNECTED', externalGetAttempts: 2,
    externalWrites: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, tenantId: null, keyId: claim.currentKeyId, publicKeyFingerprintSha256: 'b'.repeat(64),
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId };
  let external = recordQl241Report({}, getReport, company, audit, source);
  external = ql241PrepareOwnerReview(external, company, audit, source, 'owner_review_team_5',
    Object.fromEntries(QL241_CHECKS.map(key => [key, true])) as Record<typeof QL241_CHECKS[number], boolean>);
  const upstream = { release: QL242_RELEASE, status: 'DUAL_SIGNATURES_CHECKED_HELD',
    reason: 'Synthetic dual signature comparison only.', signedAuditCompared: true,
    signedOwnerDecisionCompared: true, independentlyWitnessedProvenance: false,
    ownerIdentityVerified: false, actualOwnerAuthorization: false, realGatewayConnection: 'DISCONNECTED',
    rehearsalState: 'AUDIT_REVIEW_ONLY_HELD', externalRequests: 0, externalWrites: 0,
    liveCalls: 0, liveSms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, gatewayAuditId: claim.gatewayAuditId, sourceRevision: proof.sourceRevision,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayPublicKeyFingerprintSha256: 'b'.repeat(64), ownerPublicKeyFingerprintSha256: 'c'.repeat(64),
    rollbackReceiptId: 'np-rollback-receipt-001', ownerDecision: 'REQUEST_READ_ONLY_REHEARSAL', transitions: [] };
  const ownerRollout = recordQl242Report({}, upstream, company, source, audit, external);
  const report = { release: QL243_RELEASE, status: 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD',
    reason: 'Independent proof still awaited.', company, ownerIdentityClaimSignatureChecked: true,
    ownerIdentityIndependentlyConfirmed: false, gatewayAuditGetChecked: true,
    gatewayAuditDurabilityIndependentlyConfirmed: false, actualOwnerAuthorization: false,
    connectionState: 'DISCONNECTED', livePilotRelease: false, getAttempts: 4,
    writeAttempts: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    identityAttestationId: 'np-identity-attestation-001', gatewayAuditId: claim.gatewayAuditId,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    sourceRevision: proof.sourceRevision, gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64), witnessPublicKeyFingerprintSha256: 'd'.repeat(64) };
  return { source, audit, external, ownerRollout, report, proof };
}

describe('QL-243 zero-dispatch, four-company and six-application review rules', () => {
  it('has six companion apps, six open release blockers and all 12 existing holds', () => {
    expect(QL243_SIX_APPS).toHaveLength(6);
    expect(QL243_BLOCKERS).toHaveLength(6);
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every(x => x.state === 'HELD_UNVERIFIED')).toBe(true);
    const rows = ql243Portfolio({}, {}, {}, {}, {});
    expect(rows).toHaveLength(4);
    expect(rows.every(r => r.connection === 'DISCONNECTED' && r.pilotHolds === 12)).toBe(true);
    expect(inspectQl243Report({}, 'devilndove', {}, {}, {}, {}).status).toBe('UPSTREAM_MISSING_HELD');
  });
  it('only reconciles current Devil n Dove source-linked signed GET claims as UNATTESTED', () => {
    const x = rig();
    const result = inspectQl243Report(x.report, 'devilndove', x.source, x.audit, x.external, x.ownerRollout);
    expect(result.status).toBe('AUTHENTICATED_READS_REPORTED_UNATTESTED_HELD');
    expect(result).toMatchObject({ actualConnection: 'DISCONNECTED', actualOwnerAuthorization: false,
      livePilotRelease: false, writeAttempts: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12 });
    expect(result.reference?.getAttempts).toBe(4);
    expect(JSON.stringify(result)).not.toContain(x.report.reason);
    expect(inspectQl243Report(x.report, 'yw', x.source, x.audit, x.external, x.ownerRollout).status).toBe('UPSTREAM_MISSING_HELD');
  });
  it('accepts offline witness CLI only as separate UNATTESTED claim with no GETs', () => {
    const x = rig();
    const offline = { ...x.report, status: 'IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD',
      gatewayAuditGetChecked: false, getAttempts: 0, identityRef: 'np-owner-ref-001' };
    expect(inspectQl243Report(offline, 'devilndove', x.source, x.audit, x.external, x.ownerRollout).status)
      .toBe('IDENTITY_SIGNATURE_REPORTED_UNATTESTED_HELD');
    expect(inspectQl243Report({ ...offline, getAttempts: 4 }, 'devilndove', x.source, x.audit, x.external, x.ownerRollout).status).toBe('DENIED_SCOPE');
  });
  it('rejects forged grants, extra secrets, witness conflicts and audit drift', () => {
    const x = rig();
    const run = (report: unknown) => inspectQl243Report(report, 'devilndove', x.source, x.audit, x.external, x.ownerRollout).status;
    for (const patch of [{ actualOwnerAuthorization: true }, { connectionState: 'CONNECTED' },
      { livePilotRelease: true }, { writeAttempts: 1 }, { calls: 1 }, { realPilotHolds: 0 },
      { ownerIdentityIndependentlyConfirmed: true }]) expect(run({ ...x.report, ...patch })).toBe('DENIED_SCOPE');
    expect(run({ ...x.report, token: 'DONT_STORE' })).toBe('DENIED_SCHEMA');
    expect(run({ ...x.report, identityRef: 'np-foreign-owner' })).toBe('DENIED_SCHEMA');
    expect(run({ ...x.report, gatewayAuditId: 'np-not-current-audit' })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, sourceRevision: 'e'.repeat(40) })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, witnessPublicKeyFingerprintSha256: 'c'.repeat(64) })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, witnessPublicKeyFingerprintSha256: 'not-hash' })).toBe('DENIED_CHAIN');
  });
  it('freezes prior evidence when QL-242 source changes', () => {
    const x = rig();
    const accepted = inspectQl243Report(x.report, 'devilndove', x.source, x.audit, x.external, x.ownerRollout);
    const changedSource: Ql239Ledger = { ...x.source, devilndove: {
      ...x.source.devilndove!, proof: { ...x.proof, sourceRevision: 'e'.repeat(40) }
    } };
    expect(ql243CurrentStatus(accepted, 'devilndove', changedSource, x.audit, x.external, x.ownerRollout)).toBe('SOURCE_DRIFT_HELD');
  });
});

let host: HTMLDivElement; let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find(b => b.textContent?.includes(label));
  if (!button) throw new Error(`Button not found: ${label}`);
  await act(async () => button.click());
}

describe('QL-243 operator connection-testing workspace', () => {
  it('shows exact six-app handoff, four disconnected companies, help and blocked pilot', async () => {
    await click('Secure gateway connection tests HOLD', '.ql172-nav-button');
    const section = host.querySelector<HTMLElement>('[data-ql243-release]')!;
    expect(section.getAttribute('data-ql243-release')).toBe(QL243_RELEASE);
    expect(section.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(section.textContent).toContain('12/12 HELD');
    expect(section.querySelectorAll('.ql243-chips span')).toHaveLength(6);
    expect(section.textContent).toContain('PRODUCTION: GREEN DOES NOT MEAN CONNECTED');
    await click('Connection-test help');
    expect(section.textContent).toContain('ql243-test-connection.mjs');
    await click('unresolved release blockers');
    expect(section.querySelectorAll('#ql243-blocker-list li')).toHaveLength(6);
    expect(section.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    await click('Devil n Dove', '.ql172-brand');
    expect(host.querySelector<HTMLButtonElement>('[data-ql243-release] form button[type=submit]')?.disabled).toBe(false);
  });
  it('never performs browser fetches, storage writes or grants a non-candidate pilot', async () => {
    const spyFetch = vi.spyOn(globalThis, 'fetch');
    const spyStorage = vi.spyOn(Storage.prototype, 'setItem');
    await click('Secure gateway connection tests HOLD', '.ql172-nav-button');
    await click('iCamp', '.ql172-brand');
    const section = host.querySelector<HTMLElement>('[data-ql243-release]')!;
    expect(section.getAttribute('data-company')).toBe('icamp');
    expect(section.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    expect(spyFetch).not.toHaveBeenCalled(); expect(spyStorage).not.toHaveBeenCalled();
    const css = readFileSync('src/operator/ql243-connection-testing.css', 'utf8');
    for (const marker of ['@media (max-width: 650px)', ':focus-visible', 'forced-colors: active', 'min-height: 44px'])
      expect(css).toContain(marker);
  });
});
