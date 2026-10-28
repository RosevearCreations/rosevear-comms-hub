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
import { QL243_RELEASE, inspectQl243Report } from '../ql243ConnectionTesting';
import { QL244_RELEASE, QL244_BLOCKERS, QL244_SOURCES, inspectQl244Report,
  ql244CurrentStatus, ql244Portfolio } from '../ql244WitnessedHandshake';

function rig() {
  const now = new Date('2026-10-27T14:00:00.000Z'); const company = 'devilndove';
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
  const ownerReport = { release: QL242_RELEASE, status: 'DUAL_SIGNATURES_CHECKED_HELD',
    reason: 'Synthetic dual signature comparison only.', signedAuditCompared: true,
    signedOwnerDecisionCompared: true, independentlyWitnessedProvenance: false,
    ownerIdentityVerified: false, actualOwnerAuthorization: false, realGatewayConnection: 'DISCONNECTED',
    rehearsalState: 'AUDIT_REVIEW_ONLY_HELD', externalRequests: 0, externalWrites: 0,
    liveCalls: 0, liveSms: 0, providerDispatch: 0, realPilotHolds: 12,
    company, gatewayAuditId: claim.gatewayAuditId, sourceRevision: proof.sourceRevision,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64),
    rollbackReceiptId: 'np-rollback-receipt-001', ownerDecision: 'REQUEST_READ_ONLY_REHEARSAL',
    transitions: [] };
  const ownerRollout = recordQl242Report({}, ownerReport, company, source, audit, external);
  const ql243Report = { release: QL243_RELEASE, status: 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD',
    reason: 'Separate attestation pending', company, ownerIdentityClaimSignatureChecked: true,
    ownerIdentityIndependentlyConfirmed: false, gatewayAuditGetChecked: true,
    gatewayAuditDurabilityIndependentlyConfirmed: false, actualOwnerAuthorization: false,
    connectionState: 'DISCONNECTED', livePilotRelease: false, getAttempts: 4,
    writeAttempts: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    identityAttestationId: 'np-identity-attestation-001', gatewayAuditId: claim.gatewayAuditId,
    healthReceiptId: proof.healthReceiptId, capabilitiesReceiptId: proof.capabilitiesReceiptId,
    sourceRevision: proof.sourceRevision, gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64), witnessPublicKeyFingerprintSha256: 'd'.repeat(64) };
  const connectionTests = { devilndove: inspectQl243Report(ql243Report, company,
    source, audit, external, ownerRollout) };
  const report = { release: QL244_RELEASE, status: 'TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD',
    reason: 'Synthetic local QL-244 test only.', company, assessorSignatureChecked: true,
    conditionalOwnerRequestSignatureChecked: true, witnessedSourceIndependentlyConfirmed: false,
    credentialExchangeIndependentlyConfirmed: false, ownerIdentityIndependentlyConfirmed: false,
    actualOwnerAuthorization: false, conditionalPilotDecision: 'CONDITIONAL_REVIEW_REQUEST_ONLY_HELD',
    actualConnection: 'DISCONNECTED', actualWrites: 0, calls: 0, sms: 0, providerDispatch: 0,
    realPilotHolds: 12, gatewayAuditId: claim.gatewayAuditId,
    identityAttestationId: ql243Report.identityAttestationId,
    assessorReceiptId: 'np-assessor-receipt-001', sourceRevision: proof.sourceRevision,
    gatewayPublicKeyFingerprintSha256: 'b'.repeat(64),
    ownerPublicKeyFingerprintSha256: 'c'.repeat(64),
    witnessPublicKeyFingerprintSha256: 'd'.repeat(64),
    assessorPublicKeyFingerprintSha256: 'e'.repeat(64),
    credentialMetadata: QL244_SOURCES.map((system, i) => ({
      system, keyId: 'np-ql244-key-' + (i + 1),
      receiptId: 'np-exchange-receipt-' + (i + 1),
      review: 'OWNER_APPROVAL_NOT_GIVEN_HELD'
    }))
  };
  return { source, audit, external, ownerRollout, connectionTests, report, proof };
}

describe('QL-244 strict, source-linked four-company held credential review', () => {
  it('has six companion sources, six blockers and twelve real communications holds', () => {
    expect(QL244_SOURCES).toHaveLength(6);
    expect(QL244_BLOCKERS).toHaveLength(6);
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every(x => x.state === 'HELD_UNVERIFIED')).toBe(true);
    const x = rig();
    expect(ql244Portfolio({}, x.source, x.audit, x.external, x.ownerRollout, x.connectionTests))
      .toEqual(expect.arrayContaining([expect.objectContaining({ company: 'devilndove',
        connection: 'DISCONNECTED', ownerPermission: 'NOT GIVEN', pilotHolds: 12 })]));
  });
  it('reconciles a correct sanitized signed-review claim but does not approve any connection', () => {
    const x = rig();
    const result = inspectQl244Report(x.report, 'devilndove', x.source, x.audit,
      x.external, x.ownerRollout, x.connectionTests);
    expect(result).toMatchObject({ status: 'SIGNED_WITNESS_CLAIM_RECONCILED_HELD',
      actualConnection: 'DISCONNECTED', ownerAuthorized: false,
      calls: 0, sms: 0, writes: 0, providerDispatch: 0, realPilotHolds: 12 });
    expect(result.reference?.credentialMetadata).toHaveLength(6);
    expect(JSON.stringify(result)).not.toContain(x.report.reason);
    expect(inspectQl244Report(x.report, 'icamp', x.source, x.audit,
      x.external, x.ownerRollout, x.connectionTests).status).toBe('UPSTREAM_MISSING_HELD');
  });
  it('rejects extra secrets, missing rows, spoofed scopes, duplicate keys and foreign pins', () => {
    const x = rig();
    const run = (report: unknown) => inspectQl244Report(report, 'devilndove',
      x.source, x.audit, x.external, x.ownerRollout, x.connectionTests).status;
    for (const patch of [{ actualOwnerAuthorization: true }, { actualConnection: 'CONNECTED' },
      { actualWrites: 1 }, { calls: 1 }, { realPilotHolds: 0 },
      { ownerIdentityIndependentlyConfirmed: true }, { witnessedSourceIndependentlyConfirmed: true },
      { conditionalPilotDecision: 'APPROVED' }])
      expect(run({ ...x.report, ...patch })).toBe('DENIED_SCOPE');
    expect(run({ ...x.report, bearerToken: 'SECRET' })).toBe('DENIED_SCHEMA');
    expect(run({ ...x.report, credentialMetadata: [] })).toBe('DENIED_SCHEMA');
    const rows = [...x.report.credentialMetadata];
    rows[2] = { ...rows[2], keyId: rows[1].keyId };
    expect(run({ ...x.report, credentialMetadata: rows })).toBe('DENIED_SCHEMA');
    expect(run({ ...x.report, witnessPublicKeyFingerprintSha256: 'b'.repeat(64) })).toBe('DENIED_CHAIN');
    expect(run({ ...x.report, gatewayAuditId: 'np-something-else' })).toBe('DENIED_CHAIN');
  });
  it('freezes prior matching review if the QL-243 source revision changes', () => {
    const x = rig();
    const accepted = inspectQl244Report(x.report, 'devilndove', x.source,
      x.audit, x.external, x.ownerRollout, x.connectionTests);
    const changed: Ql239Ledger = { ...x.source, devilndove: {
      ...x.source.devilndove!, proof: { ...x.proof, sourceRevision: 'f'.repeat(40) }
    } };
    expect(ql244CurrentStatus(accepted, 'devilndove', changed, x.audit, x.external,
      x.ownerRollout, x.connectionTests)).toBe('SOURCE_DRIFT_HELD');
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
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)]
    .find(b => b.textContent?.includes(label));
  if (!button) throw new Error('Button not found: ' + label);
  await act(async () => button.click());
}

describe('QL-244 operator UI', () => {
  it('presents four HELD companies, six metadata sources, help, blockers, and owner deny', async () => {
    await click('Witnessed handshake & pilot HOLD', '.ql172-nav-button');
    const section = host.querySelector<HTMLElement>('[data-ql244-release]')!;
    expect(section.dataset.ql244Release).toBe(QL244_RELEASE);
    expect(section.querySelectorAll('tbody tr')).toHaveLength(10);
    expect(section.textContent).toContain('12/12 real communications prerequisites');
    expect(section.textContent).toContain('OWNER AUTHORIZATION: NOT GIVEN');
    expect(section.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    await click('Witness & credential help');
    expect(section.textContent).toContain('ql244-verify-conditional-review.mjs');
    await click('open blockers');
    expect(section.querySelectorAll('#ql244-blockers-list li')).toHaveLength(6);
    await click('Devil n Dove', '.ql172-brand');
    expect(host.querySelector<HTMLButtonElement>('[data-ql244-release] form button[type=submit]')?.disabled).toBe(false);
  });
  it('does not fetch, store browser credentials, activate noncandidate tenant or fake approval', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await click('Witnessed handshake & pilot HOLD', '.ql172-nav-button');
    await click('iCamp', '.ql172-brand');
    const section = host.querySelector<HTMLElement>('[data-ql244-release]')!;
    expect(section.dataset.company).toBe('icamp');
    expect(section.textContent).toContain('DISCONNECTED');
    expect(section.querySelector<HTMLButtonElement>('form button[type=submit]')?.disabled).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    const css = readFileSync('src/operator/ql244-witnessed-handshake.css', 'utf8');
    for (const marker of ['@media (max-width: 650px)', ':focus-visible', 'forced-colors: active', 'min-height: 44px'])
      expect(css).toContain(marker);
  });
});
